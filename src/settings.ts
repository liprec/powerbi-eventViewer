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

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import { interfaces } from "powerbi-visuals-utils-formattingutils";
import { AxisDimensions, LegendDimensions, PlotDimensions, Scales } from "./data";
import { FontStyle, FontWeight, LegendPosition, TimePrecision } from "./enums";

import DataView = powerbi.DataView;
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import TextProperties = interfaces.TextProperties;

const fontFamily: string = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";

export class Settings extends DataViewObjectsParser {
    public general: GeneralSettings = new GeneralSettings();
    public legend: LegendSettings = new LegendSettings();
    public deviceAxis: DeviceAxis = new DeviceAxis();
    public timeAxis: TimeAxis = new TimeAxis();
    public stateColor: StateColorSettings = new StateColorSettings();
    public unknown: UnknownSettings = new UnknownSettings();
}

class GeneralSettings {
    public padding: number = 5;
    public x: number = this.padding;
    public y: number = this.padding;
    public width: number;
    public height: number;
    public legendDimensions: LegendDimensions;
    public axisDimensions: AxisDimensions;
    public scales: Scales;

    public get plotDimensions(): PlotDimensions {
        return {
            x1: this.x + <number>this.axisDimensions.deviceAxisLabel.width,
            x2: this.width - this.padding,
            y1: this.y + (this.legendDimensions?.topHeight || 0),
            y2:
                this.y +
                this.height -
                (this.legendDimensions?.bottomHeight || 0) -
                <number>this.axisDimensions.timeAxisLabel.height,
        };
    }
}

class LegendSettings {
    public show: boolean = true;
    public position: LegendPosition = LegendPosition.TopLeft;
    public fontColor: string = "#666666";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public fontStyle: number = FontStyle.Normal;
    public fontWeight: number = FontWeight.Normal;
    public get FontStyle(): string {
        switch (this.fontStyle) {
            default:
            case FontStyle.Normal:
                return "Normal";
            case FontStyle.Italic:
                return "Italic";
        }
    }
    public get FontSize(): string {
        return `${this.fontSize}pt`;
    }
    public get TextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.FontSize,
            fontStyle: this.FontStyle,
            fontWeight: this.fontWeight.toString(),
        };
    }
}

class DeviceAxis {
    // Default text settings
    public fontColor: string = "#666666";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public fontStyle: number = FontStyle.Normal;
    public fontWeight: number = FontWeight.Normal;
    public get FontStyle(): string {
        switch (this.fontStyle) {
            default:
            case FontStyle.Normal:
                return "Normal";
            case FontStyle.Italic:
                return "Italic";
        }
    }
    public get FontSize(): string {
        return `${this.fontSize}pt`;
    }
    public get TextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.FontSize,
            fontStyle: this.FontStyle,
            fontWeight: this.fontWeight.toString(),
        };
    }
}

class TimeAxis {
    leadTime: number | null = null;
    leadTimePrecision: number = TimePrecision.Second;
    lagTime: number | null = null;
    lagTimePrecision: number = TimePrecision.Second;
    // Default text settings
    public fontColor: string = "#666666";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public fontStyle: number = FontStyle.Normal;
    public fontWeight: number = FontWeight.Normal;
    public get FontStyle(): string {
        switch (this.fontStyle) {
            default:
            case FontStyle.Normal:
                return "Normal";
            case FontStyle.Italic:
                return "Italic";
        }
    }
    public get FontSize(): string {
        return `${this.fontSize}pt`;
    }
    public get TextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.FontSize,
            fontStyle: this.FontStyle,
            fontWeight: this.fontWeight.toString(),
        };
    }
}

class StateColorSettings {
    public fill: string = "#EEEEEE";
}

class UnknownSettings {
    public show: boolean = true;
    public label: string = "Unknown";
    public color: string = "#EEEEEE";
}

export function parseSettings(dataView: DataView): Settings {
    return Settings.parse(dataView);
}
