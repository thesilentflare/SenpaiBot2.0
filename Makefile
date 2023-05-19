# Globals
.PHONY= dev-setup
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
	@echo "To perform reset+setup+seed, type: make dev-setup"
	@echo "To only seed database, type: make dev-seed"
	@echo "To only reset database, type: make dev-reset"
	@echo "------------------------------------"


# Prod Functions
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

run-bot:
	${PYTHON} src/senpaibot.py

run-portal:
	${PYTHON} manage.py runserver


# Dev functions
dev-seed:
	@echo "Seeding..."
	${PYTHON} ./dev/seed.py

dev-setup: dev-reset
	@echo "Checking virtual environment..."
	[ ! -d "./virt" ] && ${PYTHON} -m venv virt || source virt/Scripts/activate
	@echo "Checking if project dependencies are installed..."
	pip install -r requirements.txt
	@echo "Checking database and migrations..."
	${PYTHON} manage.py migrate
	@echo "Creating default superuser..."
	DJANGO_SUPERUSER_USERNAME="admin" \
	DJANGO_SUPERUSER_PASSWORD="Senpaibot2!" \
	DJANGO_SUPERUSER_EMAIL="senpai@bot.com" \
	${PYTHON} manage.py createsuperuser --noinput
	@echo "Seeding..."
	${PYTHON} ./dev/seed.py

dev-reset:
	@echo "Resetting..."
	${PYTHON} manage.py flush

dev-bot: run-bot

dev-portal:
	. virt/Scripts/activate
	${PYTHON} manage.py runserver
