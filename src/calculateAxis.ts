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

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import { max } from "d3";

import measureSvgTextHeight = textMeasurementService.measureSvgTextHeight;
import measureSvgTextWidth = textMeasurementService.measureSvgTextWidth;

import { Device, EventDataPoints, Legend } from "./data";
import { Settings } from "./settings";

export function calculateAxis(data: EventDataPoints, settings: Settings): Settings {
    const deviceTextProperties = settings.deviceAxis.TextProperties;
    const deviceTextWidth = <number>max(
            data.devices.map((device: Device) => {
                deviceTextProperties.text = device.name;
                return measureSvgTextWidth(deviceTextProperties);
            })
        ) + 20;

    const timeTextProperties = settings.timeAxis.TextProperties;
    const timeTextHeight = <number>max(
            data.times.map((date: Date) => {
                timeTextProperties.text = data.timeFormatter.format(date);
                return measureSvgTextHeight(timeTextProperties);
            })
        ) + 20;

    settings.general.axisDimensions = {
        deviceAxisLabel: { width: deviceTextWidth },
        timeAxisLabel: { height: timeTextHeight },
    };
    return settings;
}
