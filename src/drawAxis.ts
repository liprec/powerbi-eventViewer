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
import { axisBottom, axisLeft } from "d3-axis";
import { BaseType, Selection } from "d3-selection";

import { EventDataPoints } from "./data";
import { Selectors } from "./selectors";
import { Settings } from "./settings";

export function drawAxis(
    selection: Selection<BaseType, unknown, BaseType, unknown>,
    data: EventDataPoints,
    settings: Settings,
    clickEvent: (event: MouseEvent, deviceName: string) => void
): void {
    let lastRight = 0;
    const deviceAxis = axisLeft(settings.general.scales.deviceScale);
    const timeAxis = axisBottom(settings.general.scales.timeScale).tickFormat((d: Date) =>
        data.timeFormatter.format(d)
    );

    selection
        .select(Selectors.deviceAxis.selectorName)
        .attr("transform", `translate(${settings.general.plotDimensions.x1}, 0)`)
        .attr("color", settings.deviceAxis.fontColor)
        .style("font-family", settings.deviceAxis.fontFamily)
        .style("font-size", settings.deviceAxis.FontSize)
        .style("font-weight", settings.deviceAxis.fontWeight)
        .style("font-style", settings.deviceAxis.FontStyle)
        .call(deviceAxis)
        .selectAll(".tick")
        .on("click", clickEvent);

    selection
        .select(Selectors.timeAxis.selectorName)
        .attr("transform", `translate(0,${settings.general.plotDimensions.y2})`)
        .attr("color", settings.timeAxis.fontColor)
        .style("font-family", settings.timeAxis.fontFamily)
        .style("font-size", settings.timeAxis.FontSize)
        .style("font-weight", settings.timeAxis.fontWeight)
        .style("font-style", settings.timeAxis.FontStyle)
        .call(timeAxis)
        .selectAll(".tick")
        .each(function () {
            const size = (<SVGAElement>this).getBoundingClientRect();
            if (size.left < lastRight || size.right > settings.general.plotDimensions.x2) {
                (<SVGAElement>this).setAttribute("opacity", "0");
            } else {
                lastRight = size.right;
            }
        });
}
