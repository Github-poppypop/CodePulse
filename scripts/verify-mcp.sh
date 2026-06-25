#!/usr/bin/env bash
set -e
hermes mcp list
hermes mcp test filesystem
hermes mcp test github
