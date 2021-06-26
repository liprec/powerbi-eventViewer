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
import { ScaleTime } from "d3";
import { ScaleBand } from "d3-scale";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import { Settings } from "./settings";

import ISelectionId = powerbi.visuals.ISelectionId;
import IValueFormatter = valueFormatter.IValueFormatter;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

export interface EventDataPoints {
    devices: Device[];
    times: Date[];
    timeFormatter: IValueFormatter;
    legend: Legend[];
    settings: Settings;
}

export interface Device {
    name: string;
    states: State[];
    selectionId: ISelectionId;
}

export interface State {
    color: string;
    dataPoint?: DataPoint;
    endTime?: Date;
    formatter: IValueFormatter;
    isUnknown?: boolean;
    name: string;
    selectionId?: ISelectionId;
    deviceSelectionId?: ISelectionId;
    state?: PrimitiveValue | null;
    time: Date;
    tooltip?: () => VisualTooltipDataItem[];
}

export interface DataPoint {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export interface Legend {
    legend: string;
    color: string;
}

export interface Scales {
    timeScale: ScaleTime<number, number, never>;
    deviceScale: ScaleBand<string>;
}

export interface AxisDimensions {
    deviceAxisLabel: Dimensions;
    timeAxisLabel: Dimensions;
}

export interface Dimensions {
    height?: number;
    width?: number;
}

export interface LegendDimensions {
    topHeight?: number;
    bottomHeight?: number;
}

export interface PlotDimensions {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}
