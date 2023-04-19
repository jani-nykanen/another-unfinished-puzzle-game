
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
