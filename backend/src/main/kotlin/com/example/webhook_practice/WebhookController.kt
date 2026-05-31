package com.example.webhook_practice

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class PushEvent(val repository: String, val receivedAt: String)

@RestController
class WebhookController {

    private val secret = System.getenv("WEBHOOK_SECRET") ?: "my-webhook-secret"
    private val events = mutableListOf<PushEvent>()

    @PostMapping("/webhook")
    fun receive(
        @RequestHeader("X-Hub-Signature-256") signature: String,
        @RequestBody payload: String
    ): String {
        if (!isValidSignature(signature, payload)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid signature")
        }

        val json = org.springframework.boot.json.BasicJsonParser().parseMap(payload)
        val repoName = (json["repository"] as? Map<*, *>)?.get("name") as? String ?: "unknown"
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

    private fun isValidSignature(signature: String, payload: String): Boolean {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(secret.toByteArray(), "HmacSHA256"))
        val expected = "sha256=" + mac.doFinal(payload.toByteArray())
            .joinToString("") { "%02x".format(it) }
        return signature == expected
    }
}
