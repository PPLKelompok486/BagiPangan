<?php

namespace Tests\Feature;

use Tests\TestCase;

class EnvExampleHasNoSecretsTest extends TestCase
{
    public function test_env_example_does_not_contain_known_leaked_values(): void
    {
        $path = base_path('.env.example');
        $this->assertFileExists($path);

        $contents = file_get_contents($path);

        // Strings historically leaked through this file. If any reappear the
        // file is back to committing real credentials — fail loudly.
        $forbidden = [
            'BagiPangan123',
            'aws-1-ap-northeast-1.pooler.supabase.com',
            'postgres.lefboeqsssrrttflykrb',
        ];

        foreach ($forbidden as $needle) {
            $this->assertStringNotContainsString(
                $needle,
                $contents,
                ".env.example must not contain '{$needle}' — replace with a placeholder and rotate the credential."
            );
        }
    }
}
