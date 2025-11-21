# syntax=docker/dockerfile:1

# ====== BUILD STAGE ======
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom and download dependencies first (layer cache)
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

# Copy source and build the jar
COPY src ./src
RUN mvn -q -DskipTests package

# ====== RUNTIME STAGE ======
FROM eclipse-temurin:21-jre

ENV JAVA_OPTS="" \
    SERVER_PORT=8999

WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/middleware-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8999

# Healthcheck like in your Python image
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${SERVER_PORT}/health" || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
