package com.example.webhook_practice

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.client.RestClient


@RestController
@CrossOrigin(origins = ["http://localhost:3000"])
class ContactController {

    private val discordWebhookUrl = System.getenv("DISCORD_WEBHOOK_URL") ?: ""
    private val restClient = RestClient.create()

    @PostMapping("/contact")
    @ResponseStatus(HttpStatus.OK)
    fun contact(@RequestBody body: ContactRequest) {
        val name = body.name.trim()
        val email = body.email.trim()
        val message = body.message.trim()

        val emailRegex = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

        if (name.isEmpty() || name.length > 100) throw RuntimeException("名前が不正です")
        if (email.isEmpty() || email.length > 200 || !emailRegex.matches((email))) throw RuntimeException("メールアドレスが不正です")
        if (message.isEmpty() || message.length > 5000) throw RuntimeException("メッセージが不正です")

        val content = """
            **お問い合わせが届きました**
            **名前** $name
            **メール** $email
            **メッセージ**
            $message
        """.trimIndent()

        restClient.post()
            .uri(discordWebhookUrl)
            .contentType(MediaType.APPLICATION_JSON)
            .body(mapOf("content" to content))
            .retrieve()
            .toBodilessEntity()
    }
}

data class ContactRequest(
    val name: String,
    val email: String,
    val message: String,
)