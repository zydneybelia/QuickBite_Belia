package com.quickbite.backend.controller;

import com.quickbite.backend.model.RefreshToken;
import com.quickbite.backend.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/refresh-tokens")
@CrossOrigin(origins = "*")
public class RefreshTokenController {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @GetMapping
    public List<RefreshToken> getAllRefreshTokens() {
        return refreshTokenRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<RefreshToken> getRefreshTokensByUserId(@PathVariable String userId) {
        return refreshTokenRepository.findByUser_Id(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RefreshToken> getRefreshTokenById(@PathVariable String id) {
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findById(id);
        return refreshToken.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RefreshToken> createRefreshToken(@RequestBody RefreshToken refreshToken) {
        RefreshToken savedToken = refreshTokenRepository.save(refreshToken);
        return ResponseEntity.ok(savedToken);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RefreshToken> updateRefreshToken(@PathVariable String id, @RequestBody RefreshToken tokenDetails) {
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findById(id);
        if (refreshToken.isPresent()) {
            RefreshToken existingToken = refreshToken.get();
            existingToken.setRevoked(tokenDetails.getRevoked());
            existingToken.setExpiryDate(tokenDetails.getExpiryDate());
            RefreshToken updatedToken = refreshTokenRepository.save(existingToken);
            return ResponseEntity.ok(updatedToken);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRefreshToken(@PathVariable String id) {
        if (refreshTokenRepository.existsById(id)) {
            refreshTokenRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
