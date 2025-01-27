#!/bin/bash

# Function to display usage
show_usage() {
    echo "Usage: ./dkr.sh [command]"
    echo "Commands:"
    echo "  build       - Build Docker image"
    echo "  start       - Start containers"
    echo "  stop        - Stop containers"
    echo "  restart     - Restart containers"
    echo "  logs        - Show container logs"
    echo "  ps          - Show container status"
    echo "  clean       - Remove containers and images"
    echo "  shell       - Open shell in container"
}

# Check if command is provided
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

# Process commands
case "$1" in
    build)
        docker-compose build
        ;;
    start)
        docker-compose up -d
        ;;
    stop)
        docker-compose down
        ;;
    restart)
        docker-compose restart
        ;;
    logs)
        docker-compose logs -f
        ;;
    ps)
        docker-compose ps
        ;;
    clean)
        docker-compose down --rmi all --volumes --remove-orphans
        ;;
    shell)
        docker-compose exec nextblog sh
        ;;
    *)
        show_usage
        exit 1
        ;;
esac 