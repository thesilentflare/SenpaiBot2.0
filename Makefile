# Globals
PYTHON = python
FILES =

help:
	@echo "---------------HELP-----------------"
	@echo "To setup the bot type: make setup"
	@echo "To run the bot type: make run"
	@echo "------------------------------------"

setup:
	@echo "Checking if project dependencies are installed..."
	pip install -r requirements.txt
	@echo "Checking if project files are generated..."
	[ -f .env ] || cp .env.example .env
	for FILE in ${FILES}; do \
		touch "$${FILE}"; \
	done

run:
	${PYTHON} src/senpaibot.py