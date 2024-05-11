# Globals
.PHONY= dev-setup setup setup-portal run-bot run-portal dev-seed dev-undo-migrate dev-reset dev-portal dev-bot
PYTHON := $(shell which python3)
PIP := $(shell which pip3)
VENV = .venv
FILES =

# Detect operating system
ifeq ($(shell uname -s),Windows_NT)
    VENV_ACTIVATE = venv\Scripts\activate.bat
else
    VENV_ACTIVATE = venv/bin/activate
endif

help:
	@echo "------------------------------------"
	@echo "---------------HELP-----------------"
	@echo "To setup, type: make setup"
	@echo "To setup portal, type: make setup-portal"
	@echo "To run the bot, type: make run-bot"
	@echo "To run the admin portal, type: make run-portal"
	@echo "To run the grab latest updates, type: make update"
	@echo "------------------------------------"
	@echo "----------------DEV-----------------"
	@echo "------------------------------------"
	@echo "To perform reset+setup+seed, type: make dev-setup"
	@echo "To only seed database, type: make dev-seed"
	@echo "To only reset database, type: make dev-reset"
	@echo "To create migration file, type: make dev-create-migration"
	@echo "To use new migration file(s), type: make dev-migrate-up"
	@echo "To only rollback migrations, type: make dev-undo-migrate"
	@echo "To run the bot, type: make dev-bot"
	@echo "To run the admin portal, type: make dev-portal"
	@echo "------------------------------------"


# Prod Functions
setup:
	@echo "Checking if project dependencies are installed..."
	${PIP} install -r requirements.txt
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

update:
	@echo "Checking if theres an update..."
	git pull
	@echo "Checking database and migrations..."
	${PYTHON} manage.py migrate

# Dev functions
dev-seed:
	@echo "Seeding..."
	${PYTHON} ./dev/seed.py

dev-setup: dev-reset
	@echo "Checking virtual environment..."
	[ ! -d "./virt" ] && ${PYTHON} -m venv virt || source $(VENV_ACTIVATE)
	@echo "Checking if project dependencies are installed..."
	${PIP} install -r requirements.txt
	@echo "Checking database and migrations..."
	${PYTHON} manage.py migrate
	@echo "Creating default superuser..."
	DJANGO_SUPERUSER_USERNAME="admin" \
	DJANGO_SUPERUSER_PASSWORD="Senpaibot2!" \
	DJANGO_SUPERUSER_EMAIL="senpai@bot.com" \
	${PYTHON} manage.py createsuperuser --noinput
	@echo "Seeding..."
	${PYTHON} ./dev/seed.py
	@echo "..."
	@echo "..."
	@echo "..."
	@echo "COMPLETED!!!"
	@echo "..."
	@echo "MAKE SURE TO EDIT THE DATABASE VALUES PER DEVELOPMENT DISCORD SERVER"
	@echo "(e.g. Channel Model IDs)"

dev-reset:
	@echo "Resetting..."
	${PYTHON} manage.py flush

dev-create-migration:
	${PYTHON} manage.py makemigrations

dev-migrate-up:
	${PYTHON} manage.py migrate

dev-undo-migrate:
	@echo "Please enter file to revert to: "; \
	read FILE; \
	${PYTHON} manage.py migrate models ${FILE}

dev-bot: run-bot

dev-portal:
	. $(VENV_ACTIVATE)
	${PYTHON} manage.py runserver
