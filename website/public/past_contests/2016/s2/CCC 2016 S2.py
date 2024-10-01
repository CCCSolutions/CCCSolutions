# By Oscar Zhou, Abbey Park High School
# This solution still requires commented explanations. Please feel free to add them!

import sys
input = sys.stdin.readline

q, n = int(input()), int(input())
dmoj, peg = list(map(int, input().split())), list(map(int, input().split()))

total = 0

if q == 1:
    dmoj.sort()
    peg.sort()

else:
    dmoj.sort()
    peg.sort(reverse = True)

for i in range(n):
    total += max(dmoj[i], peg[i])
print(total)