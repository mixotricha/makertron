
/***************************************************************************
 *   Copyright (c) Damien Towning         (connolly.damien@gmail.com) 2017 *
 *                                                                         *
 *   This file is part of the Makertron CSG cad system.                    *
 *                                                                         *
 *   This library is free software; you can redistribute it and/or         *
 *   modify it under the terms of the GNU Library General Public           *
 *   License as published by the Free Software Foundation; either          *
 *   version 2 of the License, or (at your option) any later version.      *
 *                                                                         *
 *   This library  is distributed in the hope that it will be useful,      *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU Library General Public License for more details.                  *
 *                                                                         *
 *   You should have received a copy of the GNU Library General Public     *
 *   License along with this library; see the file COPYING.LIB. If not,    *
 *   write to the Free Software Foundation, Inc., 59 Temple Place,         *
 *   Suite 330, Boston, MA  02111-1307, USA                                *
 *                                                                         *
 ***************************************************************************/

#include "PrintUtils.h"
#include <sstream>
#include <stdio.h>
#include <boost/algorithm/string.hpp>
#include <boost/algorithm/string/predicate.hpp>
#include <boost/circular_buffer.hpp>
#include <boost/filesystem.hpp>

//OutputHandlerFunc *outputhandler = NULL;
//void *outputhandler_data = NULL;

typedef void (*callbackFP_t)(char* bastard);
callbackFP_t douglas_adams; 

int set_callback(callbackFP_t fp) {
    douglas_adams = fp;
}

void PRINT(const std::string &msg)
{
	#ifdef DEBUG
		std::cout << msg << std::endl;
	#else 
		(*douglas_adams)( (char*)msg.c_str() );	  
 	#endif
}

