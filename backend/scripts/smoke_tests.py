#!/usr/bin/env python3
"""
Smoke tests для автоматической проверки PROD после деплоя
Проверяет критичные эндпоинты и функции системы
"""
import asyncio
import httpx
import sys
import argparse
from datetime import datetime
from typing import List, Dict, Any

# URL продакшена
PROD_URL = "https://olai.onrender.com"

class SmokeTest:
    def __init__(self, name: str, endpoint: str, method: str = "GET",
                 data: Dict = None, expected_status: int = 200,
                 validate_response: callable = None):
        self.name = name
        self.endpoint = endpoint
        self.method = method
        self.data = data
        self.expected_status = expected_status
        self.validate_response = validate_response
        self.passed = False
        self.error = None
        self.response_time = 0

class SmokeTestRunner:
    def __init__(self, base_url: str = PROD_URL):
        self.base_url = base_url
        self.tests: List[SmokeTest] = []
        self.results = []

    def add_test(self, test: SmokeTest):
        self.tests.append(test)

    async def run_test(self, test: SmokeTest, client: httpx.AsyncClient) -> Dict[str, Any]:
        """Выполнить один тест"""
        url = f"{self.base_url}{test.endpoint}"
        start_time = datetime.now()

        try:
            if test.method == "GET":
                response = await client.get(url, timeout=30.0)
            elif test.method == "POST":
                response = await client.post(url, json=test.data, timeout=30.0)
            else:
                raise ValueError(f"Unsupported method: {test.method}")

            test.response_time = (datetime.now() - start_time).total_seconds()

            # Проверка статус кода
            if response.status_code != test.expected_status:
                test.error = f"Expected status {test.expected_status}, got {response.status_code}"
                test.passed = False
            # Кастомная валидация ответа
            elif test.validate_response:
                try:
                    test.validate_response(response.json())
                    test.passed = True
                except Exception as e:
                    test.error = f"Validation failed: {str(e)}"
                    test.passed = False
            else:
                test.passed = True

        except Exception as e:
            test.error = f"Request failed: {str(e)}"
            test.passed = False
            test.response_time = (datetime.now() - start_time).total_seconds()

        return {
            "name": test.name,
            "endpoint": test.endpoint,
            "passed": test.passed,
            "error": test.error,
            "response_time": test.response_time
        }

    async def run_all(self) -> Dict[str, Any]:
        """Выполнить все тесты"""
        print(f"🚀 Running smoke tests on {self.base_url}")
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        async with httpx.AsyncClient() as client:
            self.results = []
            for test in self.tests:
                print(f"⏳ Testing: {test.name}...", end=" ")
                result = await self.run_test(test, client)
                self.results.append(result)

                if result["passed"]:
                    print(f"✅ PASSED ({result['response_time']:.2f}s)")
                else:
                    print(f"❌ FAILED ({result['response_time']:.2f}s)")
                    print(f"   Error: {result['error']}")

        # Сводка
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed

        print("\n" + "="*60)
        print(f"📊 SUMMARY: {passed}/{total} tests passed")
        if failed > 0:
            print(f"❌ {failed} tests failed")
        print("="*60)

        return {
            "timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "total": total,
            "passed": passed,
            "failed": failed,
            "tests": self.results,
            "success": failed == 0
        }


# Валидаторы ответов
def validate_settings(data: Dict):
    """Проверить структуру настроек"""
    assert "sizeOptions" in data, "Missing sizeOptions"
    assert "formFactors" in data, "Missing formFactors"
    assert "materials" in data, "Missing materials"
    assert len(data["sizeOptions"]) > 0, "Empty sizeOptions"

def validate_gems(data: List):
    """Проверить список камней"""
    assert isinstance(data, list), "Gems should be a list"
    if len(data) > 0:
        gem = data[0]
        assert "id" in gem, "Gem missing id"
        assert "name" in gem, "Gem missing name"
        assert "shape" in gem, "Gem missing shape"

def validate_logs(data: List):
    """Проверить логи"""
    assert isinstance(data, list), "Logs should be a list"
    if len(data) > 0:
        log = data[0]
        assert "level" in log, "Log missing level"
        assert "source" in log, "Log missing source"
        assert "message" in log, "Log missing message"

def validate_examples(data: List):
    """Проверить примеры"""
    assert isinstance(data, list), "Examples should be a list"

def validate_generation_settings(data: Dict):
    """Проверить настройки генерации"""
    assert "prompt_variants" in data, "Missing prompt_variants"
    assert isinstance(data["prompt_variants"], dict), "prompt_variants should be dict"


async def run_e2e_generation_test(base_url: str) -> Dict[str, Any]:
    """Запустить E2E тест генерации кулона (dry run)"""
    print("\n" + "="*60)
    print("🧪 Running E2E Generation Test (Dry Run)")
    print("="*60)

    async with httpx.AsyncClient() as client:
        try:
            start_time = datetime.now()

            # Вызов dry run теста генерации
            response = await client.post(
                f"{base_url}/api/health/test-generation?dry_run=true",
                timeout=30.0
            )

            elapsed = (datetime.now() - start_time).total_seconds()

            if response.status_code == 200:
                result = response.json()

                print(f"\n✅ E2E Test PASSED ({elapsed:.2f}s)")
                print(f"   Steps completed: {len(result.get('steps', []))}")

                for step in result.get('steps', []):
                    status_icon = "✅" if step['status'] == 'passed' else "❌"
                    print(f"   {status_icon} {step['step']}")

                return {
                    "name": "E2E Generation Flow",
                    "passed": True,
                    "response_time": elapsed,
                    "steps": result.get('steps', [])
                }
            else:
                print(f"\n❌ E2E Test FAILED ({elapsed:.2f}s)")
                print(f"   Status: {response.status_code}")
                return {
                    "name": "E2E Generation Flow",
                    "passed": False,
                    "response_time": elapsed,
                    "error": f"HTTP {response.status_code}"
                }

        except Exception as e:
            print(f"\n❌ E2E Test FAILED")
            print(f"   Error: {str(e)}")
            return {
                "name": "E2E Generation Flow",
                "passed": False,
                "error": str(e)
            }


async def main():
    """Основная функция запуска тестов"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run smoke tests on PROD")
    parser.add_argument('--e2e', action='store_true',
                        help='Include E2E generation test (dry run, free)')
    parser.add_argument('--real-e2e', action='store_true',
                        help='Run REAL E2E test with FAL.ai (costs money!)')
    args = parser.parse_args()

    runner = SmokeTestRunner()

    # Критичные эндпоинты
    runner.add_test(SmokeTest(
        name="Health Check",
        endpoint="/",
        expected_status=200
    ))

    runner.add_test(SmokeTest(
        name="API Root",
        endpoint="/api",
        expected_status=200
    ))

    runner.add_test(SmokeTest(
        name="Settings Endpoint",
        endpoint="/api/settings",
        validate_response=validate_settings
    ))

    runner.add_test(SmokeTest(
        name="Gems List",
        endpoint="/api/gems",
        validate_response=validate_gems
    ))

    runner.add_test(SmokeTest(
        name="Gem Shapes",
        endpoint="/api/gems/shapes",
        validate_response=lambda data: isinstance(data, list)
    ))

    runner.add_test(SmokeTest(
        name="Examples Gallery",
        endpoint="/api/examples",
        validate_response=validate_examples
    ))

    runner.add_test(SmokeTest(
        name="Logs Endpoint",
        endpoint="/api/logs?limit=1",
        validate_response=validate_logs
    ))

    runner.add_test(SmokeTest(
        name="Generation Settings",
        endpoint="/api/generation-settings",
        validate_response=validate_generation_settings
    ))

    runner.add_test(SmokeTest(
        name="History Endpoint",
        endpoint="/api/history?limit=1",
        validate_response=lambda data: isinstance(data, list)
    ))

    # Запуск тестов
    results = await runner.run_all()

    # E2E тест генерации (опционально)
    if args.e2e or args.real_e2e:
        e2e_result = await run_e2e_generation_test(PROD_URL)

        # Добавить результат E2E теста в общую статистику
        results["tests"].append(e2e_result)
        results["total"] += 1
        if e2e_result["passed"]:
            results["passed"] += 1
        else:
            results["failed"] += 1

        results["success"] = results["failed"] == 0

        # Обновить сводку
        print("\n" + "="*60)
        print(f"📊 UPDATED SUMMARY: {results['passed']}/{results['total']} tests passed")
        if results["failed"] > 0:
            print(f"❌ {results['failed']} tests failed")
        print("="*60)

    # Логирование результатов на сервер
    try:
        async with httpx.AsyncClient() as client:
            log_message = f"Smoke tests: {results['passed']}/{results['total']} passed"
            log_level = "info" if results["success"] else "error"

            await client.post(
                f"{PROD_URL}/api/logs",
                params={
                    "level": log_level,
                    "source": "smoke_tests",
                    "message": log_message
                },
                json={"details": results},
                timeout=10.0
            )
            print(f"\n📝 Results logged to server")
    except Exception as e:
        print(f"\n⚠️  Failed to log results: {e}")

    # Exit code для CI/CD
    sys.exit(0 if results["success"] else 1)


if __name__ == "__main__":
    asyncio.run(main())
