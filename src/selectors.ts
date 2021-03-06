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

import { CssConstants } from "powerbi-visuals-utils-svgutils";

import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

export class Selectors {
    public static Svg: ClassAndSelector = createClassAndSelector("svg");
    public static CheckList: ClassAndSelector = createClassAndSelector("checkList");
    public static CheckListItem: ClassAndSelector = createClassAndSelector("checkListItem");
    public static PlotArea: ClassAndSelector = createClassAndSelector("plotarea");
    public static LandingPage: ClassAndSelector = createClassAndSelector("landingPage");
    public static LegendArea: ClassAndSelector = createClassAndSelector("legendarea");
    public static LegendBorder: ClassAndSelector = createClassAndSelector("legendborder");
    public static Legend: ClassAndSelector = createClassAndSelector("legend");
    public static LegendItem: ClassAndSelector = createClassAndSelector("legendItem");
    public static Axis: ClassAndSelector = createClassAndSelector("axis");
    public static deviceAxis: ClassAndSelector = createClassAndSelector("deviceaxis");
    public static timeAxis: ClassAndSelector = createClassAndSelector("timeaxis");
    public static Devices: ClassAndSelector = createClassAndSelector("devices");
    public static Device: ClassAndSelector = createClassAndSelector("device");
    public static States: ClassAndSelector = createClassAndSelector("states");
    public static State: ClassAndSelector = createClassAndSelector("state");
}
