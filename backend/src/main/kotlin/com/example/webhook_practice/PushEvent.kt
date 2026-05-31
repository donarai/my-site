package com.example.webhook_practice

import jakarta.persistence.*

@Entity
@Table(name = "push_events")
data class PushEvent(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val repository: String,
    val receivedAt: String,
    val compareUrl: String = ""
)