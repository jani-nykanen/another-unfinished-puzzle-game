
.PHONY: js
js:
	tsc

.PHONY: jswatch
jswatch:
	tsc -w

all: js

.PHONY: server
server:
	python3 -m http.server

.PHONY: levels
levels:
	mkdir -p assets/levelpacks
	./scripts/levelpacker.py ./levels/pack1 ./assets/levelpacks/pack1.json
 