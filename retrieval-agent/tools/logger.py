"""
Logging utilities for debugging API calls.

Provides structured logging for search API requests and responses.
"""

import json
import logging
from typing import Any, Dict, Optional
from datetime import datetime

# Configure logger
logger = logging.getLogger("retrieval-agent")
logger.setLevel(logging.DEBUG)

# Console handler with formatting
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)


def log_api_request(provider: str, method: str, params: Dict[str, Any]) -> None:
    """Log outgoing API request.
    
    Args:
        provider: API provider name (e.g., "Exa", "Perplexity")
        method: API method being called
        params: Request parameters
    """
    logger.info(f"🔵 {provider} API Request: {method}")
    logger.debug(f"   Parameters: {json.dumps(params, indent=2, default=str)}")


def log_api_response(
    provider: str,
    method: str,
    response_data: Dict[str, Any],
    duration_ms: Optional[float] = None
) -> None:
    """Log API response.
    
    Args:
        provider: API provider name
        method: API method that was called
        response_data: Response data (will be truncated for logging)
        duration_ms: Request duration in milliseconds
    """
    result_count = len(response_data.get("results", []))
    duration_str = f" ({duration_ms:.0f}ms)" if duration_ms else ""
    
    logger.info(f"🟢 {provider} API Response: {method}{duration_str}")
    logger.debug(f"   Result count: {result_count}")
    
    # Log first result as sample (truncated)
    if result_count > 0:
        first_result = response_data["results"][0]
        logger.debug(f"   Sample result:")
        logger.debug(f"      Title: {first_result.get('title', 'N/A')[:80]}...")
        logger.debug(f"      URL: {first_result.get('url', 'N/A')}")
        logger.debug(f"      Snippet: {str(first_result.get('snippet', first_result.get('text', 'N/A')))[:100]}...")


def log_api_error(provider: str, method: str, error: Exception) -> None:
    """Log API error.
    
    Args:
        provider: API provider name
        method: API method that failed
        error: Exception that occurred
    """
    logger.error(f"🔴 {provider} API Error: {method}")
    logger.error(f"   Error: {str(error)}")


def log_search_results_summary(provider: str, query: str, result_count: int) -> None:
    """Log summary of search results.
    
    Args:
        provider: Search provider name
        query: Search query
        result_count: Number of results returned
    """
    logger.info(f"📊 {provider} Search Summary: query='{query}' results={result_count}")

