#!/usr/bin/python3


import glob
import xml.etree.ElementTree as ET
import os
import sys
import json
from pathlib import Path


def parse_layer(inp):

    data = []
    inp = inp.replace("\n", "")
    data = list(map(lambda x : int(x), inp.split(",")))

    return data


def parse_file(path):

    name = Path(path).stem

    f = open(path, "r")
    root = ET.parse(path).getroot()

    width = root.attrib["width"]
    height = root.attrib["height"]
    layers = {}

    for l in root.iter("layer"):
        layers[l.attrib["name"]] = parse_layer(l[0].text)

    return {
        "name": name,
        "width": width,
        "height": height,
        "layers": layers
    }


inputFolder = sys.argv[1]
outputFile = sys.argv[2]

files = sorted(glob.glob(inputFolder + "/*.tmx"))

print(files)
levels = []

outputData = {
    "levels": []
}

for f in files:
    outputData["levels"].append(parse_file(f))

jsonOutput = json.dumps(outputData)

fout = open(outputFile, "w")
fout.write(jsonOutput)
fout.close()
