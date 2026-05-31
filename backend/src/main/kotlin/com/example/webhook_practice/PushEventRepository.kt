package com.example.webhook_practice

import org.springframework.data.jpa.repository.JpaRepository

interface PushEventRepository : JpaRepository<PushEvent, Long>
