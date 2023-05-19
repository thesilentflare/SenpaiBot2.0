# Globals
PYTHON = python
VENV = .venv
FILES =

help:
	@echo "------------------------------------"
	@echo "---------------HELP-----------------"
	@echo "To setup, type: make setup"
	@echo "To setup portal, type: make setup-portal"
	@echo "To run the bot, type: make run-bot"
	@echo "To run the admin portal, type: make run-portal"
	@echo "------------------------------------"
	@echo "----------------DEV-----------------"
	@echo "------------------------------------"
	@echo "To seed database, type: make seed"
	@echo "------------------------------------"



setup:
	@echo "Checking if project dependencies are installed..."
	pip install -r requirements.txt
	@echo "Checking if project files are generated..."
	[ -f .env ] || cp .env.example .env
	for FILE in ${FILES}; do \
		touch "$${FILE}"; \
	done

setup-portal:
	@echo "Checking database and migrations..."
	${PYTHON} manage.py migrate
	@echo "Create superuser..."
	${PYTHON} manage.py createsuperuser


seed:
	@echo "Seeding..."
	${PYTHON} ./dev/seed.py

run-bot:
	${PYTHON} src/senpaibot.py

run-portal:
	${PYTHON} manage.py runserver