/*
 *
 * Copyright (c) 2021 Jan Pieter Posthuma / DataScenarios
 *
 * All rights reserved.
 *
 * MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";
import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import DataViewHierarchyLevel = powerbi.DataViewHierarchyLevel;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import IViewport = powerbi.IViewport;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import PrimitiveValue = powerbi.PrimitiveValue;

import { getObject } from "powerbi-visuals-utils-dataviewutils/lib/dataViewObjects";
import { Checks, Roles, TraceEvents } from "./enums";
import { PerfTimer } from "./perfTimer";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { parseSettings, Settings } from "./settings";
import { Device, State, EventDataPoints, Legend } from "./data";
import { max, min } from "d3";

export function converter(
    dataView: DataView | undefined,
    viewPort: IViewport,
    host: IVisualHost,
    colors: ISandboxExtendedColorPalette,
    locale: string,
    setCheck: (check: string, status: boolean) => void
): EventDataPoints | undefined {
    const timer = PerfTimer.START(TraceEvents.convertor, true);
    if (!checkValidDataview(dataView, setCheck)) {
        timer();
        return;
    }
    const settings = parseSettings(<DataView>dataView);
    const metadata = dataView && dataView.metadata && dataView.metadata.columns;
    const rows = <DataViewMatrixNode[]>(
        (dataView &&
            dataView.matrix &&
            dataView.matrix.rows &&
            dataView.matrix.rows.root &&
            dataView.matrix.rows.root.children)
    );
    const rowLevels = <DataViewHierarchyLevel[]>(
        (dataView && dataView.matrix && dataView.matrix.rows && dataView.matrix.rows.levels)
    );
    const timeColumn: DataViewMetadataColumn = <DataViewMetadataColumn>(
        metadata?.filter((c: DataViewMetadataColumn) => (c.roles ? c.roles[Roles.TimeRole] : false))[0]
    );

    const timeFormatter = valueFormatter.create({
        format: timeColumn.format,
        cultureSelector: locale,
    });

    const timeSeries: Date[] = [];
    const legend: Legend[] = [];

    if (settings.unknown.show) {
        legend.push({
            index: 0,
            legend: settings.unknown.label,
            color: settings.unknown.color,
        });
    }
    const devices: Device[] = getDevices(rows, host, rowLevels, timeSeries, legend, dataView, colors, timeFormatter);

    const sTime = new Date(JSON.parse(JSON.stringify(<Date>min(timeSeries))));
    const eTime = new Date(JSON.parse(JSON.stringify(<Date>max(timeSeries))));

    if (settings.timeAxis.leadTime !== null)
        sTime.setSeconds(sTime.getSeconds() + settings.timeAxis.leadTime * settings.timeAxis.leadTimePrecision);
    if (settings.timeAxis.lagTime !== null)
        eTime.setSeconds(eTime.getSeconds() + settings.timeAxis.lagTime * settings.timeAxis.lagTimePrecision);

    updateDeviceStates(devices, settings, sTime, eTime, timeFormatter, timeSeries);

    settings.general.width = viewPort.width - 2 * settings.general.padding;
    settings.general.height = viewPort.height - 2 * settings.general.padding;

    timer();
    return {
        devices,
        times: [sTime, eTime],
        timeFormatter,
        legend: legend.sort((l1, l2) => l1.index - l2.index),
        settings,
    };
}

function getDevices(
    rows: powerbi.DataViewMatrixNode[],
    host: IVisualHost,
    rowLevels: powerbi.DataViewHierarchyLevel[],
    timeSeries: Date[],
    legend: Legend[],
    dataView: powerbi.DataView | undefined,
    colors: ISandboxExtendedColorPalette,
    timeFormatter: valueFormatter.IValueFormatter
): Device[] {
    const unknownCorrection = legend.length;
    return rows.map((row: DataViewMatrixNode) => {
        const deviceSelectionId = host.createSelectionIdBuilder().withMatrixNode(row, rowLevels).createSelectionId();
        const device: Device = <Device>{
            key: -1,
            name: row.value,
            states: [],
            selectionId: deviceSelectionId,
        };
        if (row.children) {
            device.states = row.children.map((measure: DataViewMatrixNode) => {
                const time = new Date(<string>measure.value);
                if (!timeSeries.some((t: Date) => t === time)) timeSeries.push(time);
                const state = measure.values && measure.values[0].value;
                const isHighlight = measure.values && measure.values[0].highlight !== null;
                if (!legend.some((s: Legend) => s.legend === state)) {
                    legend.push({
                        index: legend.length,
                        legend: <string>state?.toString(),
                        color: getColorByIndex(
                            legend.length,
                            (legend.length - unknownCorrection).toString(),
                            dataView?.metadata.objects,
                            "stateColor",
                            colors
                        ),
                    });
                }
                const selectionId = host
                    .createSelectionIdBuilder()
                    .withMatrixNode(row, rowLevels)
                    .withMatrixNode(measure, rowLevels)
                    .createSelectionId();
                return <State>{
                    color: legend.filter((l: Legend) => l.legend === <string>state?.toString())[0].color,
                    formatter: timeFormatter,
                    isUnknown: false,
                    name: row.value,
                    selectionId,
                    deviceSelectionId,
                    state,
                    isHighlight,
                    time,
                    startTime: time,
                    tooltip: getTooltip,
                };
            });
        }
        return device;
    });
}

function updateDeviceStates(
    devices: Device[],
    settings: Settings,
    sTime: Date,
    eTime: Date,
    timeFormatter: valueFormatter.IValueFormatter,
    timeSeries: Date[]
) {
    devices.forEach((device: Device) => {
        if (settings.unknown.show && device.states[0].time > sTime) {
            device.states = [
                <State>{
                    color: settings.unknown.color,
                    formatter: timeFormatter,
                    isUnknown: true,
                    name: device.name,
                    selectionId: undefined,
                    state: settings.unknown.label,
                    isHighlight: false,
                    time: sTime,
                    startTime: <Date>min(timeSeries),
                    tooltip: getTooltip,
                },
            ].concat(device.states);
        }
        const nrOfEvents = device.states.length;
        device.states.forEach((state: State, index: number, all: State[]) => {
            if (index < nrOfEvents - 1) state.endTime = all[index + 1].time;
            else state.endTime = eTime; //max(timeSeries);
            if (state.time < sTime) state.time = sTime;
        });
        device.states = device.states.filter((state: State) => <Date>state.endTime > sTime);
    });
}

function checkValidDataview(dataView: DataView | undefined, setCheck: (check: Checks, status: boolean) => void) {
    const checkDevices = !!(
        dataView &&
        dataView.metadata &&
        dataView.metadata.columns &&
        dataView.metadata.columns.filter((c: DataViewMetadataColumn) => (c.roles ? c.roles[Roles.DevicesRole] : false))
            .length > 0
    );
    const checkState = !!(
        dataView &&
        dataView.metadata &&
        dataView.metadata.columns &&
        dataView.metadata.columns.filter((c: DataViewMetadataColumn) => (c.roles ? c.roles[Roles.StateRole] : false))
            .length > 0
    );
    const checkTime = !!(
        dataView &&
        dataView.metadata &&
        dataView.metadata.columns &&
        dataView.metadata.columns.filter((c: DataViewMetadataColumn) => (c.roles ? c.roles[Roles.TimeRole] : false))
            .length > 0
    );
    const checkValidTime = !!(
        dataView &&
        dataView.matrix &&
        dataView.matrix.rows.root &&
        dataView.matrix.rows.root.children &&
        dataView.matrix.rows.root.children.length > 0 &&
        dataView.matrix.rows.root.children[0].children &&
        dataView.matrix.rows.root.children[0].children.length > 0 &&
        isValidDate(dataView.matrix.rows.root.children[0].children[0].value)
    );
    const isValid = checkDevices && checkState && checkTime && checkValidTime;

    setCheck(Checks.Device, checkDevices);
    setCheck(Checks.Time, checkTime);
    setCheck(Checks.ValidTime, checkTime && checkValidTime);
    setCheck(Checks.State, checkState);

    return isValid;
}

function getColorByIndex(
    index: number,
    queryName: string,
    objects: powerbi.DataViewObjects | undefined,
    capability: string,
    colorPalette: ISandboxExtendedColorPalette
): string {
    if (objects) {
        const color = getObject(objects, capability);
        if (color) {
            const instance = color.$instances;
            if (instance) {
                const setting = instance[index];
                if (setting) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return (<any>setting.fill).solid.color;
                }
            }
        }
    }

    return colorPalette.getColor(queryName).value;
}

function getTooltip(this: State): VisualTooltipDataItem[] {
    return [
        {
            header: this.name,
            displayName: "State",
            color: this.color,
            value: <string>this.state?.toString(),
        },
        {
            header: "",
            displayName: "Start time",
            color: this.color,
            opacity: "0",
            value: this.formatter.format(this.startTime),
        },
        {
            header: "",
            displayName: "End time",
            color: this.color,
            opacity: "0",
            value: this.formatter.format(this.endTime),
        },
    ];
}

function isValidDate(date?: PrimitiveValue) {
    return date instanceof Date && !isNaN(date.getTime());
}
