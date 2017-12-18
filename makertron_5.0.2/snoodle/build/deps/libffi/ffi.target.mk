# This file is generated by gyp; do not edit.

TOOLSET := target
TARGET := ffi
DEFS_Debug := \
	'-DNODE_GYP_MODULE_NAME=ffi' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DPIC' \
	'-DFFI_BUILDING' \
	'-DHAVE_CONFIG_H' \
	'-DDEBUG' \
	'-D_DEBUG'

# Flags passed to all source files.
CFLAGS_Debug := \
	-fPIC \
	-pthread \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-m64 \
	-g \
	-O0

# Flags passed to only C files.
CFLAGS_C_Debug :=

# Flags passed to only C++ files.
CFLAGS_CC_Debug := \
	-fno-rtti \
	-fno-exceptions \
	-std=gnu++0x

INCS_Debug := \
	-I/usr/include/nodejs/include/node \
	-I/usr/include/nodejs/src \
	-I/usr/include/nodejs/deps/uv/include \
	-I/usr/include/nodejs/deps/v8/include \
	-I$(srcdir)/deps/libffi/include \
	-I$(srcdir)/deps/libffi/config/linux/x64

DEFS_Release := \
	'-DNODE_GYP_MODULE_NAME=ffi' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DPIC' \
	'-DFFI_BUILDING' \
	'-DHAVE_CONFIG_H' \
	'-DNDEBUG'

# Flags passed to all source files.
CFLAGS_Release := \
	-fPIC \
	-pthread \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-m64 \
	-O3 \
	-ffunction-sections \
	-fdata-sections \
	-fno-omit-frame-pointer

# Flags passed to only C files.
CFLAGS_C_Release :=

# Flags passed to only C++ files.
CFLAGS_CC_Release := \
	-fno-rtti \
	-fno-exceptions \
	-std=gnu++0x

INCS_Release := \
	-I/usr/include/nodejs/include/node \
	-I/usr/include/nodejs/src \
	-I/usr/include/nodejs/deps/uv/include \
	-I/usr/include/nodejs/deps/v8/include \
	-I$(srcdir)/deps/libffi/include \
	-I$(srcdir)/deps/libffi/config/linux/x64

OBJS := \
	$(obj).target/$(TARGET)/deps/libffi/src/prep_cif.o \
	$(obj).target/$(TARGET)/deps/libffi/src/types.o \
	$(obj).target/$(TARGET)/deps/libffi/src/raw_api.o \
	$(obj).target/$(TARGET)/deps/libffi/src/java_raw_api.o \
	$(obj).target/$(TARGET)/deps/libffi/src/closures.o \
	$(obj).target/$(TARGET)/deps/libffi/src/x86/ffi.o \
	$(obj).target/$(TARGET)/deps/libffi/src/x86/ffi64.o \
	$(obj).target/$(TARGET)/deps/libffi/src/x86/unix64.o \
	$(obj).target/$(TARGET)/deps/libffi/src/x86/sysv.o

# Add to the list of files we specially track dependencies for.
all_deps += $(OBJS)

# CFLAGS et al overrides must be target-local.
# See "Target-specific Variable Values" in the GNU Make manual.
$(OBJS): TOOLSET := $(TOOLSET)
$(OBJS): GYP_CFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_C_$(BUILDTYPE))
$(OBJS): GYP_CXXFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_CC_$(BUILDTYPE))

# Suffix rules, putting all outputs into $(obj).

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.S FORCE_DO_CMD
	@$(call do_cmd,cc,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

# Try building from generated source, too.

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.S FORCE_DO_CMD
	@$(call do_cmd,cc,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.S FORCE_DO_CMD
	@$(call do_cmd,cc,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

# End of this set of suffix rules
### Rules for final target.
LDFLAGS_Debug := \
	-pthread \
	-rdynamic \
	-m64

LDFLAGS_Release := \
	-pthread \
	-rdynamic \
	-m64

LIBS :=

$(obj).target/deps/libffi/libffi.a: GYP_LDFLAGS := $(LDFLAGS_$(BUILDTYPE))
$(obj).target/deps/libffi/libffi.a: LIBS := $(LIBS)
$(obj).target/deps/libffi/libffi.a: TOOLSET := $(TOOLSET)
$(obj).target/deps/libffi/libffi.a: $(OBJS) FORCE_DO_CMD
	$(call do_cmd,alink)

all_deps += $(obj).target/deps/libffi/libffi.a
# Add target alias
.PHONY: ffi
ffi: $(obj).target/deps/libffi/libffi.a

# Add target alias to "all" target.
.PHONY: all
all: ffi

# Add target alias
.PHONY: ffi
ffi: $(builddir)/libffi.a

# Copy this to the static library output path.
$(builddir)/libffi.a: TOOLSET := $(TOOLSET)
$(builddir)/libffi.a: $(obj).target/deps/libffi/libffi.a FORCE_DO_CMD
	$(call do_cmd,copy)

all_deps += $(builddir)/libffi.a
# Short alias for building this static library.
.PHONY: libffi.a
libffi.a: $(obj).target/deps/libffi/libffi.a $(builddir)/libffi.a

# Add static library to "all" target.
.PHONY: all
all: $(builddir)/libffi.a

