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

import { BaseType, Selection } from "d3-selection";

import ISelectionId = powerbi.visuals.ISelectionId;
import { PerfTimer } from "./perfTimer";
import { State } from "./data";

export const highlightOpacity = 1;
export const backgroundOpacity = 0.25;

export function syncSelectionState(
    selections: Selection<BaseType, unknown, BaseType, unknown>,
    selectionIds: ISelectionId[]
) {
    const timer = PerfTimer.START("syncSelectionState()", true);
    const highlightOpacity = 1;
    const backgroundOpacity = 0.4;
    if (!selections || !selectionIds) {
        timer();
        return;
    }

    if (!selectionIds.length) {
        selections
            .style("opacity", () => {
                return highlightOpacity;
            })
            .style("stroke-opacity", () => {
                return highlightOpacity;
            });
        timer();
        return;
    }

    selections
        .style("opacity", (state: State) => {
            const isSelected: boolean =
                isSelectionIdInArray(selectionIds, state.selectionId) ||
                isSelectionIdInArray(selectionIds, state.deviceSelectionId);
            return isSelected ? highlightOpacity : backgroundOpacity;
        })
        .style("stroke-opacity", (state: State) => {
            const isSelected: boolean =
                isSelectionIdInArray(selectionIds, state.selectionId) ||
                isSelectionIdInArray(selectionIds, state.deviceSelectionId);
            return isSelected ? highlightOpacity : backgroundOpacity;
        });
    timer();
}

function isSelectionIdInArray(selectionIds: ISelectionId[], selectionId?: ISelectionId): boolean {
    if (!selectionIds || !selectionId) {
        return false;
    }
    return selectionIds.some((currentSelectionId: ISelectionId) => {
        return currentSelectionId.includes(selectionId);
    });
}
