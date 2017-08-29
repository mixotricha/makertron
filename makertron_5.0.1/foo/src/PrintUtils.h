#pragma once

#include <string>
#include <list>
#include <iostream>
#include <boost/format.hpp>

#include <libintl.h>
#include <locale.h>

typedef void (*callbackFP_t)(char* theStr1);

extern "C" int set_callback(callbackFP_t fp);

void PRINT(const std::string &msg);

