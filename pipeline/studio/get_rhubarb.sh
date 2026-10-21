#!/bin/sh
# Free lip sync tool (Rhubarb Lip Sync, MIT). Usage: sh get_rhubarb.sh -> /home/claude/lp/studio/bin/rhubarb
set -e
[ -x /home/claude/lp/studio/bin/rhubarb ] && exit 0
cd /tmp && curl -sfL -o rhubarb.zip https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.14.0/Rhubarb-Lip-Sync-1.14.0-Linux.zip
rm -rf rhubarb && mkdir rhubarb && cd rhubarb && unzip -q ../rhubarb.zip
mkdir -p /home/claude/lp/studio/bin && cp -r */* /home/claude/lp/studio/bin/
