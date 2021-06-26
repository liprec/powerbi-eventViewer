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

import { scaleBand, scaleTime } from "d3";

import { Device, EventDataPoints } from "./data";
import { Settings } from "./settings";

export function calculateScales(data: EventDataPoints, settings: Settings): Settings {
    const plotDimensions = settings.general.plotDimensions;
    const timeScale = scaleTime()
        .domain(data.times)
        .range([plotDimensions.x1, plotDimensions.x2]);
    const legendScale = scaleBand()
        .domain(data.devices.map((device: Device) => device.name))
        .range([plotDimensions.y1, plotDimensions.y2])
        .paddingInner(0.1)
        .paddingOuter(0.2)
        .align(0.5);
    settings.general.scales = { timeScale: timeScale, deviceScale: legendScale };
    return settings;
}
