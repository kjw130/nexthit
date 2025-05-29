#!/bin/bash

# 1. Generate Prisma client
yarn prisma generate

# 2. Then build Next.js
yarn build
