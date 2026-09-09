plugins {
    java
    id("org.springframework.boot") version "3.4.5"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.exe101"
version = "0.0.1-SNAPSHOT"
description = "exe"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // ===== SPRING BOOT STARTERS =====
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")

    // ===== LOMBOK =====
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    // ===== DEVELOPMENT TOOLS =====
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    runtimeOnly("org.postgresql:postgresql")

    // ===== JWT (JJWT) =====
    // Giữ nguyên phiên bản 0.12.5 của bạn vì nó tương thích tốt với Spring Boot 3.x
    implementation("io.jsonwebtoken:jjwt-api:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.5")

    // ===== UTILS =====
    implementation("commons-codec:commons-codec:1.18.0")

    // 1. MAPSTRUCT: Để map User sang UserSummary trong file AuthServiceImpl (userMapper)
    implementation("org.mapstruct:mapstruct:1.6.3")
    annotationProcessor("org.mapstruct:mapstruct-processor:1.6.3")
    // Giúp Mapstruct phối hợp mượt mà với Lombok không bị nuốt code
    annotationProcessor("org.projectlombok:lombok-mapstruct-binding:0.2.0")

    // 2. SPRINGDOC OPENAPI: Để kích hoạt Swagger UI và đọc các @Schema viết ở Request
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.5")

    // ===== TEST =====
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // Thư viện giúp Spring Boot đọc file .env
    implementation("me.paulschwarz:spring-dotenv:4.0.0")
    implementation("io.github.cdimascio:dotenv-java:3.1.0")
    implementation("com.cloudinary:cloudinary-http5:2.4.0")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
