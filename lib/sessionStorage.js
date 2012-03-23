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
        var sessionStorage = function(){
            this.items = {};
        };

        sessionStorage.prototype = {

            setItem: function(key, value){
                this.items[key] = value;
            },

            getItem: function(key){
                return this.items[key];
            },


            clear: function(){
                this.items = {};
            },

            removeItem:  function(key){
                delete this.items[key];
            }
        };
        var sessionStorageImp = new sessionStorage();


        //RequireJS way to export
        return{
            sessionStorage: sessionStorageImp
        }
    }
);
