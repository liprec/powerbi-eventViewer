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

import { DataPoint, Device, EventDataPoints, Scales, State } from "./data";
import { Settings } from "./settings";

export function calculateData(data: EventDataPoints, settings: Settings): EventDataPoints {
    data.devices.forEach((device: Device) => {
        device.states.forEach((state: State) => {
            if (!state.dataPoint) {
                state.dataPoint = {
                    x1: settings.general.scales.timeScale(state.time),
                    x2: settings.general.scales.timeScale(state.endTime as Date),
                    y1: settings.general.scales.deviceScale(device.name),
                    y2:
                        (settings.general.scales.deviceScale(device.name) as number) +
                        settings.general.scales.deviceScale.bandwidth(),
                } as DataPoint;
            }
        });
        device.key = device.states
            .map(
                (state, index) =>
                    <number>state.dataPoint?.x1 +
                    <number>state.dataPoint?.x2 +
                    <number>state.dataPoint?.y1 +
                    <number>state.dataPoint?.y2 +
                    (state.isHighlight ? index + 1 : 0)
            )
            .reduce((a, b) => a + b);
    });
    return data;
}
