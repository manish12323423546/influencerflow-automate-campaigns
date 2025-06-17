#!/usr/bin/env python3
"""
Test Runner for AI Agents API

This script provides various testing options for the CEO-centric AI agents backend.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(cmd, description=""):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"🧪 {description}")
    print(f"{'='*60}")
    print(f"Command: {' '.join(cmd)}")
    print()
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"❌ Command not found: {cmd[0]}")
        print("Please ensure pytest is installed: pip install -r test_requirements.txt")
        return False

def install_test_dependencies():
    """Install test dependencies."""
    return run_command(
        ["pip", "install", "-r", "test_requirements.txt"],
        "Installing test dependencies"
    )

def run_basic_tests():
    """Run basic unit tests."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py::TestHealthAndInfo", "-v"],
        "Running basic health and info tests"
    )

def run_ceo_tests():
    """Run CEO agent specific tests."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py::TestCEOWorkflowExecution", "-v"],
        "Running CEO workflow execution tests"
    )

def run_websocket_tests():
    """Run WebSocket tests."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py::TestWebSocketConnections", "-v"],
        "Running WebSocket connection tests"
    )

def run_task_management_tests():
    """Run task management tests."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py::TestTaskManagement", "-v"],
        "Running task management tests"
    )

def run_workflow_integration_tests():
    """Run workflow integration tests."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py::TestWorkflowIntegration", "-v"],
        "Running workflow integration tests"
    )

def run_error_handling_tests():
    """Run error handling tests."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py::TestErrorHandling", "-v"],
        "Running error handling tests"
    )

def run_all_tests():
    """Run all tests."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py", "-v"],
        "Running all AI agents tests"
    )

def run_tests_with_coverage():
    """Run tests with coverage report."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py", "--cov=ai_agents", "--cov-report=html", "--cov-report=term"],
        "Running tests with coverage analysis"
    )

def run_performance_tests():
    """Run performance/benchmark tests."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py", "--benchmark-only"],
        "Running performance benchmarks"
    )

def run_parallel_tests():
    """Run tests in parallel."""
    return run_command(
        ["python", "-m", "pytest", "test_ai_agents.py", "-n", "auto"],
        "Running tests in parallel"
    )

def lint_code():
    """Run code linting."""
    commands = [
        (["flake8", "ai_agents.py", "test_ai_agents.py"], "Running flake8 linting"),
        (["black", "--check", "ai_agents.py", "test_ai_agents.py"], "Running black formatting check"),
        (["isort", "--check-only", "ai_agents.py", "test_ai_agents.py"], "Running isort import check")
    ]
    
    success = True
    for cmd, desc in commands:
        if not run_command(cmd, desc):
            success = False
    
    return success

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="AI Agents API Test Runner")
    parser.add_argument("--install-deps", action="store_true", help="Install test dependencies")
    parser.add_argument("--basic", action="store_true", help="Run basic tests")
    parser.add_argument("--ceo", action="store_true", help="Run CEO agent tests")
    parser.add_argument("--websocket", action="store_true", help="Run WebSocket tests")
    parser.add_argument("--tasks", action="store_true", help="Run task management tests")
    parser.add_argument("--workflow", action="store_true", help="Run workflow integration tests")
    parser.add_argument("--errors", action="store_true", help="Run error handling tests")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--coverage", action="store_true", help="Run tests with coverage")
    parser.add_argument("--performance", action="store_true", help="Run performance tests")
    parser.add_argument("--parallel", action="store_true", help="Run tests in parallel")
    parser.add_argument("--lint", action="store_true", help="Run code linting")
    parser.add_argument("--full-suite", action="store_true", help="Run complete test suite with coverage and linting")
    
    args = parser.parse_args()
    
    print("🤖 AI Agents API Test Runner")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not Path("ai_agents.py").exists():
        print("❌ ai_agents.py not found. Please run this script from the api directory.")
        sys.exit(1)
    
    success = True
    
    if args.install_deps:
        success &= install_test_dependencies()
    
    if args.basic:
        success &= run_basic_tests()
    
    if args.ceo:
        success &= run_ceo_tests()
    
    if args.websocket:
        success &= run_websocket_tests()
    
    if args.tasks:
        success &= run_task_management_tests()
    
    if args.workflow:
        success &= run_workflow_integration_tests()
    
    if args.errors:
        success &= run_error_handling_tests()
    
    if args.all:
        success &= run_all_tests()
    
    if args.coverage:
        success &= run_tests_with_coverage()
    
    if args.performance:
        success &= run_performance_tests()
    
    if args.parallel:
        success &= run_parallel_tests()
    
    if args.lint:
        success &= lint_code()
    
    if args.full_suite:
        print("\n🚀 Running full test suite...")
        success &= install_test_dependencies()
        success &= run_tests_with_coverage()
        success &= lint_code()
    
    # If no specific test requested, show help
    if not any(vars(args).values()):
        print("\n📋 Available test options:")
        print("  --install-deps    Install test dependencies")
        print("  --basic          Run basic health/info tests")
        print("  --ceo            Run CEO agent tests")
        print("  --websocket      Run WebSocket tests")
        print("  --tasks          Run task management tests")
        print("  --workflow       Run workflow integration tests")
        print("  --errors         Run error handling tests")
        print("  --all            Run all tests")
        print("  --coverage       Run tests with coverage")
        print("  --performance    Run performance tests")
        print("  --parallel       Run tests in parallel")
        print("  --lint           Run code linting")
        print("  --full-suite     Run complete test suite")
        print("\n💡 Example usage:")
        print("  python run_tests.py --install-deps --all")
        print("  python run_tests.py --full-suite")
        print("  python run_tests.py --ceo --coverage")
        return
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 All tests completed successfully!")
    else:
        print("❌ Some tests failed. Check the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 