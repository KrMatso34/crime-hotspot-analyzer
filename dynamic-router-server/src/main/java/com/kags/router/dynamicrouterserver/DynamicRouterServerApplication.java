package com.kags.router.dynamicrouterserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


@SpringBootApplication
public class DynamicRouterServerApplication {

    public static void main(String[] args) {
        // Runs on 'http://localhost:8080'
        SpringApplication.run(DynamicRouterServerApplication.class, args);
    }

}
