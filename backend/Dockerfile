# 须以仓库根目录为 build context 构建（需访问 specs/openapi.yaml）
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY specs ./specs
COPY backend/pom.xml ./backend/pom.xml
COPY backend/src ./backend/src
RUN mvn -f backend/pom.xml package -DskipTests -B -q

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /workspace/backend/target/daily-schedule-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
