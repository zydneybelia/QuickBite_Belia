package com.quickbite.backend.repository;

import com.quickbite.backend.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUser_Id(String userId);  // ✅ String not Long
    void deleteByUser_Id(String userId);              // ✅ String not Long
}