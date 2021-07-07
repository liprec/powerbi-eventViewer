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

import { getObject } from "powerbi-visuals-utils-dataviewutils/lib/dataViewObjects";
import { TraceEvents } from "./enums";
import { PerfTimer } from "./perfTimer";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { parseSettings, Settings } from "./settings";
import { Device, State, EventDataPoints, Legend } from "./data";
import { max, min } from "d3";

const devicesRole = "device";
const timeRole = "time";
const stateRole = "event";

export function converter(
    dataView: DataView | undefined,
    viewPort: IViewport,
    host: IVisualHost,
    colors: ISandboxExtendedColorPalette,
    locale: string
): EventDataPoints | undefined {
    const timer = PerfTimer.START(TraceEvents.convertor, true);
    if (!checkValidDataview(dataView)) {
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
        metadata?.filter((c: DataViewMetadataColumn) => (c.roles ? c.roles[timeRole] : false))[0]
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
    if (settings.timeAxis.leadTime !== null)
        sTime.setSeconds(sTime.getSeconds() + settings.timeAxis.leadTime * settings.timeAxis.leadTimePrecision);

    updateDeviceStates(devices, settings, sTime, timeFormatter, timeSeries);

    settings.general.width = viewPort.width - 2 * settings.general.padding;
    settings.general.height = viewPort.height - 2 * settings.general.padding;

    timer();
    return {
        devices,
        times: [sTime, <Date>max(timeSeries)],
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
    return rows.map((row: DataViewMatrixNode, index: number) => {
        const deviceSelectionId = host
            .createSelectionIdBuilder()
            .withMatrixNode(row, rowLevels)
            .createSelectionId();
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
                            legend.length.toString(),
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
            else state.endTime = max(timeSeries);
            if (state.time < sTime) state.time = sTime;
        });
        device.states = device.states.filter((state: State) => <Date>state.endTime > sTime);
    });
}

function checkValidDataview(dataView: DataView | undefined) {
    return !!(
        dataView &&
        dataView.matrix &&
        dataView.matrix.rows &&
        dataView.matrix.rows.levels &&
        dataView.matrix.rows.levels.length > 0 &&
        dataView.matrix.rows.root &&
        dataView.matrix.rows.root.children
    );
}

function getColorByIndex(
    index: number,
    queryName: string,
    objects: powerbi.DataViewObjects | undefined,
    capability: string,
    colorPalette: ISandboxExtendedColorPalette
): string {
    if (objects) {
        const color: any = getObject(objects, capability);
        if (color) {
            const instance: any = color.$instances;
            if (instance) {
                const setting: any = instance[index];
                if (setting) {
                    return setting.fill.solid.color;
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
