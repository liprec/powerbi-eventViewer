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
import { BaseType, Selection } from "d3-selection";

import { DataPoint, Device, EventDataPoints, State } from "./data";
import { drawState, getStateColor } from "./drawState";
import { Selectors } from "./selectors";
import { Settings } from "./settings";

export function drawPlot(
    selection: Selection<BaseType, unknown, BaseType, unknown>,
    data: EventDataPoints,
    settings: Settings,
    clickEvent: (event: MouseEvent, state: State) => void
): void {
    selection
        .selectAll(Selectors.Device.selectorName)
        .data(data.devices, (device: Device) => device.key)
        .join(
            (enter) => enter.append("g").classed(Selectors.Device.className, true),
            (update) => update.select(Selectors.Device.selectorName),
            (exit) => exit.remove()
        )
        .selectAll(Selectors.States.selectorName)
        .data((device: Device) => device.states)
        .join(
            (enter) =>
                enter
                    .append("path")
                    .classed(Selectors.State.className, true)
                    .attr("d", (state: State) => drawState(<DataPoint>state.dataPoint))
                    .attr("fill", (state: State) => getStateColor(state))
                    .style("opacity", (state: State) => (state.isHighlight ? 1 : 0.3)),
            (update) =>
                update
                    .select(Selectors.State.selectorName)
                    .attr("d", (state: State) => drawState(<DataPoint>state.dataPoint))
                    .attr("fill", (state: State) => getStateColor(state))
                    .style("opacity", (state: State) => (state.isHighlight ? 1 : 0.3)),
            (exit) => exit.remove()
        )
        .on("click", clickEvent);
}
