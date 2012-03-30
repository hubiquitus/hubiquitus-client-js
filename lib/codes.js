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

//Make it compatible with node and web browser
if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(
    [],
    function(){

        var contexts = {
            hStatus: 'hStatus',
            hResult: 'hResult',
            hMessage: 'hMessage'
        };

        var errors = {
            UNKNOWN: 0,
            CONN_FAILED: 1,
            CONN_TIMEOUT: 2,
            AUTH_FAILED: 3,
            ATTACH_FAILED: 4,
            ALREADY_SUBSCRIBED: 1,
            GET_SUBS_FAILED: 2
        };

        var statuses = {
            Connecting: 'connecting',
            Connected: 'connected',
            Disconnecting: 'disconnecting',
            Disconnected: 'disconnected',
            Error: 'error'
        };
        //requireJS way to export
        return{
            errors : errors,
            statuses: statuses,
            contexts: contexts
        }
    }
);