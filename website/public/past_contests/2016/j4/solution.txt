# By Oscar Zhou, Abbey Park High School
# This solution still requires commented explanations. Please feel free to add them!

# https://dmoj.ca/problem/ccc16j4

import sys
input = sys.stdin.readline

def rush(x):
    return 420 <= x < 600 or 900 <= x < 1140

def convert(x):
    if x < 10:
        return "0" + str(x)
    return str(x)

start = input().strip()
startH = int(start[:2])
startM = int(start[3:])
start = startH*60 + startM

count = 0
while count < 120:
    if rush(start):
        count += 5
    else:
        count += 10
    start += 10
    start %= 1440

endH = start//60
endM = start%60

print(convert(endH) + ":" + convert(endM))