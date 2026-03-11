import os
for filename in os.listdir('.'):
    if filename[-2:] == "in":
        print(filename)
        f = open(filename)
        lines = f.readlines()
        f.close()
        line1 = lines[0]
        line2 = " ".join(lines[1:])
        line2 = line2.replace("\n", "")
        #print line1+line2
        f2 = open(filename, "w")
        f2.write(line1)
        f2.write(line2+"\n")
        f2.close()

