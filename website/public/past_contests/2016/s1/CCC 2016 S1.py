# By Oscar Zhou, Abbey Park High School
# This solution still requires commented explanations. Please feel free to add them!

import sys
input = sys.stdin.readline

orig = input().strip()
origLst = [0]*26
final = input().strip()
finalLst = [0]*26

def convert(x):
    return ord(x) - ord("a")

for let in orig:
    origLst[convert(let)] += 1

ast = False
astCount = 0
for let in final:
    if let == "*":
        ast = True
        astCount += 1
    else:
        finalLst[convert(let)] += 1

diff = 0
for i in range(26):
    if finalLst[i] > origLst[i]:
        print("N")
        sys.exit(0)
    diff += origLst[i] - finalLst[i]

if ast:
    if astCount == diff:
        print("A")
    else:
        print("N")
else:
    if diff == 0:
        print("A")
    else:
        print("N")