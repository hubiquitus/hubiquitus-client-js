/*
 * Copyright (c) Novedia Group 2012.
 *
 *     This file is part of Hubiquitus.
 *
 *     Hubiquitus is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     Hubiquitus is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with Hubiquitus.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Emulates the behaviour of sessionStorage in a browser so that the
 * functionalities can be used in Node
 */

//Make it compatible with node and web browser
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
    [],
    function(){
        var items = {};

        var setItem = function(key, value){
            items[key] = value;
        };

        var getItem = function(key){
            return items[key];
        };

        var clear = function(){
            items = {};
        };

        var removeItem = function(key){
            delete items[key];
        };

        //RequireJS way to export
        return{
            setItem : setItem,
            getItem : getItem,
            clear : clear,
            removeItem : removeItem
        }
    }
);