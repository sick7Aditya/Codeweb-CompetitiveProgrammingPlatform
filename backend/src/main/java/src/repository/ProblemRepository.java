package src.repository;

import src.model.Problem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProblemRepository extends MongoRepository<Problem, String> {

    @Query("{ 'id': ?0 }")
    Optional<Problem> findByProblemId(String id);

    @Query("{ 'id': { $in: ?0 } }")
    List<Problem> findByProblemIdIn(List<String> ids);
}