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
import "core-js/stable";
import "regenerator-runtime/runtime";
import "./../style/visual.less";

import powerbi from "powerbi-visuals-api";
import { ITooltipServiceWrapper, createTooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { BaseType, select, Selection } from "d3-selection";
import { isEqual } from "lodash";

import DataView = powerbi.DataView;
import Selector = powerbi.data.Selector;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IViewport = powerbi.IViewport;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

import { Settings } from "./settings";
import { converter } from "./converter";
import { syncSelectionState } from "./syncSelectionState";
import { PerfTimer } from "./perfTimer";
import { Checks, FontWeight, TraceEvents } from "./enums";
import { Device, EventDataPoints, Legend, State } from "./data";
import { calculatePlot } from "./calculatePlot";
import { calculateScale } from "./calculateScale";
import { calculateAxis } from "./calculateAxis";
import { drawAxis } from "./drawAxis";
import { drawPlot } from "./drawPlot";
import { drawLegend } from "./drawLegend";
import { drawChecks } from "./drawChecks";
import { Selectors } from "./selectors";
import { calculateData } from "./calculateData";

export class EventViewer implements IVisual {
    private target: HTMLElement;
    private border: Selection<BaseType, unknown, BaseType, unknown>;
    private svg: Selection<BaseType, unknown, BaseType, unknown>;
    private plotArea: Selection<BaseType, unknown, BaseType, unknown>;
    private axis: Selection<BaseType, unknown, BaseType, unknown>;
    private checkList: Selection<BaseType, unknown, BaseType, unknown>;
    private devices: Selection<BaseType, unknown, BaseType, unknown>;
    private legendArea: Selection<BaseType, unknown, BaseType, unknown>;
    private legendBorder: Selection<BaseType, unknown, BaseType, unknown>;
    private legend: Selection<BaseType, unknown, BaseType, unknown>;
    private landingPage: Selection<BaseType, unknown, BaseType, unknown>;
    private legendTimeoutId?: number;
    private locale: string;
    private data: EventDataPoints;
    private colorConfig: unknown[];
    private events: IVisualEventService;
    private isLandingPageOn: boolean;
    private landingPageRemoved: boolean;

    private settings: Settings;
    private dataView: DataView;
    private viewPort: IViewport;
    private colorPalette: ISandboxExtendedColorPalette;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private allowInteractions: boolean;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private renderTimeoutId: number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private checks: any;

    constructor(options: VisualConstructorOptions) {
        const timer = PerfTimer.START(TraceEvents.constructor, true);
        this.locale = options.host.locale;
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.selectionManager.registerOnSelectCallback(() => {
            syncSelectionState(
                this.svg.selectAll(Selectors.State.selectorName),
                <ISelectionId[]>this.selectionManager.getSelectionIds()
            );
        });
        this.allowInteractions = options.host.allowInteractions;
        this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element);
        this.colorPalette = options.host.colorPalette;
        this.target = options.element;
        this.border = select(options.element).append("div").classed("border", true);
        this.svg = this.border.append("svg").classed(Selectors.Svg.className, true);
        this.svg.on("click", () => {
            if (this.allowInteractions) {
                this.selectionManager.clear().then(() => {
                    syncSelectionState(this.svg.selectAll(Selectors.State.selectorName), []);
                });
            }
        });
        this.svg.on("contextmenu", (event: MouseEvent) => {
            const eventTarget: HTMLElement = <HTMLElement>event.target;
            const dataPoint = <State>select(eventTarget).datum();
            this.selectionManager.showContextMenu((dataPoint && dataPoint.selectionId) || {}, {
                x: event.clientX,
                y: event.clientY,
            });
            event.preventDefault();
        });
        this.checkList = this.svg.append("g").classed(Selectors.CheckList.className, true);
        this.checkList
            .append("text")
            .text("To use this visual provide the following fields:")
            .style("font-weight", FontWeight.Bold);
        this.plotArea = this.svg.append("g").classed(Selectors.PlotArea.className, true);
        this.axis = this.svg.append("g").classed(Selectors.Axis.className, true);
        this.legendArea = this.svg.append("g").classed(Selectors.LegendArea.className, true);
        this.legendBorder = this.legendArea.append("rect").classed(Selectors.LegendBorder.className, true);
        this.legend = this.legendArea.append("g").classed(Selectors.Legend.className, true);
        this.devices = this.plotArea.append("g").classed(Selectors.Devices.className, true).attr("fill", "none");
        this.axis.append("g").classed(Selectors.deviceAxis.className, true);
        this.axis.append("g").classed(Selectors.timeAxis.className, true);
        this.events = options.host.eventService;
        this.checks = JSON.parse(
            `{ "${Checks.Device}": false, "${Checks.State}": false, "${Checks.Time}": false, "${Checks.ValidTime}": false }`
        );
        timer();
    }

    update(options: VisualUpdateOptions): void {
        const timer = PerfTimer.START(TraceEvents.update, true);
        this.events.renderingStarted(options);
        if (
            isEqual(this.dataView, options && options.dataViews && options.dataViews[0]) &&
            isEqual(this.viewPort, options && options.viewport)
        ) {
            this.events.renderingFinished(options);
            timer();
            return;
        }
        this.viewPort = options && options.viewport;
        this.dataView = options && options.dataViews && options.dataViews[0];

        this.data = <EventDataPoints>(
            converter(
                this.dataView,
                options.viewport,
                this.host,
                this.colorPalette,
                this.locale,
                (check: string, status: boolean) => (this.checks[check] = status)
            )
        );

        this.svg.attr("viewBox", `0,0,${options.viewport.width},${options.viewport.height}`);
        drawChecks(this.checkList, this.checks);

        if (!this.data) {
            if (this.checks[Checks.Time] && !this.checks[Checks.ValidTime])
                this.host.displayWarningIcon(
                    "Error in 'Time' field",
                    "Provided field for the 'Time' does not contain date/time values"
                );
            this.devices.selectAll("*").remove();
            this.axis.selectAll("*").selectAll("*").remove();
            this.legend.selectAll("*").remove();
            this.events.renderingFinished(options);
            timer();
            return;
        }

        this.settings = this.data.settings;
        this.settings = calculatePlot(this.data, this.settings);
        this.settings = calculateAxis(this.data, this.settings);
        this.settings = calculateScale(this.data, this.settings);
        this.data = calculateData(this.data, this.settings);

        if (this.settings.stateColor.persist) {
            this.settings.stateColor.persist = false;
            this.host.persistProperties({
                merge: [
                    {
                        objectName: "stateColor",
                        selector: <Selector>(<unknown>null),
                        properties: {
                            persist: false,
                            colorConfig: this.settings.stateColor.colorConfig,
                        },
                    },
                ],
            });
        }

        drawAxis(this.axis, this.data, this.settings, (event: MouseEvent, deviceName: string) => {
            const currentDevice = this.data.devices.filter((device: Device) => device.name === deviceName);
            if (currentDevice.length === 0 || !currentDevice[0].selectionId) return;
            this.processClickEvent(event, currentDevice[0].selectionId);
        });
        drawPlot(this.devices, this.data, this.settings, (event: MouseEvent, state: State) => {
            if (!state.selectionId) return;
            this.processClickEvent(event, state.selectionId);
        });
        drawLegend(this.legend, this.data, this.settings);

        this.tooltipServiceWrapper.addTooltip(
            this.plotArea.selectAll(Selectors.State.selectorName),
            (state: State) => (state.tooltip ? state.tooltip() : []),
            (state: State) => (state.selectionId ? <ISelectionId>state.selectionId : [])
        );

        this.events.renderingFinished(options);
        timer();
    }

    private processClickEvent(event: MouseEvent, selectionId: ISelectionId) {
        const isCtrlPressed: boolean = event.ctrlKey;
        const currentSelectedIds = this.selectionManager.getSelectionIds()[0];
        if (!selectionId) return;
        if (selectionId !== currentSelectedIds && !isCtrlPressed) {
            this.selectionManager.clear();
        }
        this.selectionManager.select(selectionId, isCtrlPressed).then((ids: ISelectionId[]) => {
            syncSelectionState(this.devices.selectAll(Selectors.State.selectorName), ids);
        });

        event.stopPropagation();
    }

    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions
    ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        const instanceEnumeration: VisualObjectInstanceEnumeration = Settings.enumerateObjectInstances(
            this.settings || Settings.getDefault(),
            options
        );

        let instances: VisualObjectInstance[] = [];
        let beginning = false;

        switch (options.objectName) {
            case "general":
                return [];
            case "stateColor":
                this.removeEnumerateObject(instanceEnumeration, "fill");
                if (this.settings.stateColor.colorConfig === "[]") {
                    this.removeEnumerateObject(instanceEnumeration, "colorConfig");
                    //instances = this.stateColorEnumerateObjectInstances(this.data.legend);
                } //else this.removeEnumerateObject(instanceEnumeration, "persist");
                instances = this.stateColorEnumerateObjectInstances(this.data.legend);
                beginning = true;
                break;
        }

        instances.forEach((instance: VisualObjectInstance) => {
            this.addAnInstanceToEnumeration(instanceEnumeration, instance, beginning);
        });
        return instanceEnumeration;
    }

    public stateColorEnumerateObjectInstances(states: Legend[] | undefined): VisualObjectInstance[] {
        const instances: VisualObjectInstance[] = [];
        states?.forEach((state: Legend, index: number) => {
            instances.push({
                displayName: state.legend,
                objectName: "stateColor",
                selector: { id: index.toString(), metadata: undefined },
                properties: {
                    fill: { solid: { color: state.color } },
                },
            });
        });
        return instances;
    }

    public addAnInstanceToEnumeration(
        instanceEnumeration: VisualObjectInstanceEnumeration,
        instance: VisualObjectInstance,
        beginning = false
    ): void {
        if ((<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances) {
            beginning
                ? (<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances.unshift(instance)
                : (<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances.push(instance);
        } else {
            beginning
                ? (<VisualObjectInstance[]>instanceEnumeration).unshift(instance)
                : (<VisualObjectInstance[]>instanceEnumeration).push(instance);
        }
    }

    public removeEnumerateObject(instanceEnumeration: VisualObjectInstanceEnumeration, objectName: string): void {
        if ((<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete (<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances[0].properties[objectName];
        } else {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete (<VisualObjectInstance[]>instanceEnumeration)[0].properties[objectName];
        }
    }
}
