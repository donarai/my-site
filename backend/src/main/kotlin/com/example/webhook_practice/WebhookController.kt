package com.example.webhook_practice

import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

data class PushEvent(val repository: String, val receivedAt: String)

@RestController
class WebhookController {

    private val events = mutableListOf<PushEvent>()

    @PostMapping("/webhook")
    fun receive(@RequestBody payload: Map<String, Any>): String {
        val repoName = (payload["repository"] as? Map<*, *>)?.get("name") as? String ?: "unknown"
        val event = PushEvent(
            repository = repoName,
            receivedAt = LocalDateTime.now().toString()
        )
        events.add(0, event)
        println("Webhook received: $event")
        return "ok"
    }

    @GetMapping("/activity")
    fun getActivity(): List<PushEvent> = events
}
