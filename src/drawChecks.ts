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
import { Selection, select } from "d3-selection";

import { Selectors } from "./selectors";

export function drawChecks(selection: Selection<any, any, any, any>, checks: any): void {
    let moveY = 10;
    const checkData = Object.keys(checks).map(k => {
        return { key: k, value: checks[k] };
    });
    selection
        .selectAll(Selectors.CheckListItem.selectorName)
        .data(checkData)
        .join(
            enter =>
                enter
                    .append("g")
                    .classed(Selectors.CheckListItem.className, true)
                    .each(function(d) {
                        select(this)
                            .append("path")
                            .classed("checkBox", true)
                            .attr(
                                "d",
                                d.value
                                    ? "M14 0h-12c-1.1 0-2 .9-2 2v12c0 1.1 .9 2 2 2h12c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zM7 12.4l-3.7-3.7 1.4-1.4 2.3 2.3 4.8-4.8 1.4 1.4-6.2 6.2z"
                                    : "M14 0h-12c-1.1 0-2 .9-2 2v12c0 1.1 .9 2 2 2h12c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zM14 14h-12v-12h12v12z"
                            )
                            .style("stroke", "black")
                            .style("stroke-with", "1px");

                        select(this)
                            .append("text")
                            .classed("checkText", true)
                            .attr("x", 25)
                            .attr("y", ".8em")
                            .style("alignment-baseline", "baseline")
                            .text(d.key);
                    }),
            update =>
                update.each(function(d) {
                    select(this)
                        .selectAll(".checkBox")
                        .attr(
                            "d",
                            d.value
                                ? "M14 0h-12c-1.1 0-2 .9-2 2v12c0 1.1 .9 2 2 2h12c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zM7 12.4l-3.7-3.7 1.4-1.4 2.3 2.3 4.8-4.8 1.4 1.4-6.2 6.2z"
                                : "M14 0h-12c-1.1 0-2 .9-2 2v12c0 1.1 .9 2 2 2h12c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zM14 14h-12v-12h12v12z"
                        )
                        .style("stroke", "black")
                        .style("stroke-with", "1px");

                    select(this)
                        .selectAll(".checkText")
                        .attr("x", 25)
                        .attr("y", ".8em")
                        .style("alignment-baseline", "baseline")
                        .text(d.key);
                }),
            exit => exit.remove()
        );

    selection.selectAll(Selectors.CheckListItem.selectorName).each(function() {
        const size = (<SVGGElement>this).getBoundingClientRect();
        select(this).attr("transform", `translate(0, ${moveY})`);
        moveY += size.height + 5;
    });

    selection.attr("transform", "translate(10, 40)").classed("hidden", !checkData.some(c => !c.value));
}
