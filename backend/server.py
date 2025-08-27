from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
import json
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple
import uuid
from datetime import datetime
from admin import admin_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Session feedback and telemetry endpoints
@api_router.post("/v1/telemetry")
async def submit_telemetry(telemetry_data: dict):
    """
    Submit session feedback telemetry
    Expected payload: {
        type: "session_feedback",
        value: "ideal_match" | "not_found" | "allergen_included",
        reasons?: string[],
        note?: string,
        query: string,
        context: string,
        setIds: string[],
        anonId: string,
        ts: string
    }
    """
    logging.info(f"Telemetry received: {telemetry_data}")
    
    # Store in database
    telemetry_entry = {
        **telemetry_data,
        "created_at": datetime.utcnow()
    }
    
    result = await db.session_telemetry.insert_one(telemetry_entry)
    
    return {
        "status": "success", 
        "message": "Telemetry submitted successfully",
        "id": str(result.inserted_id)
    }

@api_router.post("/v1/feedback")  
async def submit_feedback(feedback_data: dict):
    """
    Submit allergen mismatch feedback
    Expected payload: {
        event: "report_allergen_mismatch",
        recipeId?: string,
        context: string,
        query: string,
        anonId: string,
        ts: string
    }
    """
    logging.info(f"Allergen feedback received: {feedback_data}")
    
    # Store in database
    feedback_entry = {
        **feedback_data,
        "created_at": datetime.utcnow()
    }
    
    result = await db.allergen_feedback.insert_one(feedback_entry)
    
    return {
        "status": "success",
        "message": "Allergen feedback submitted successfully", 
        "id": str(result.inserted_id)
    }

@api_router.get("/v1/health")
async def health_check():
    """
    Health check endpoint with datasource information
    """
    mock_mode = os.environ.get('MOCK_MODE', '1')
    cse_key = os.environ.get('GOOGLE_CSE_KEY', '')
    cse_cx = os.environ.get('GOOGLE_CSE_CX', '')
    
    # Determine datasource based on environment
    if mock_mode == '0' and cse_key and cse_cx:
        datasource = "cse"
    else:
        datasource = "mock"
    
    return {
        "status": "healthy",
        "datasource": datasource,
        "envFlags": {
            "MOCK_MODE": mock_mode,
            "CSE_KEY_PRESENT": bool(cse_key),
            "CSE_CX_PRESENT": bool(cse_cx)
        },
        "gitSha": "local-dev",  # Would be set during deployment
        "timestamp": datetime.utcnow().isoformat()
    }

def get_mock_search_results(query: str, context: str = None) -> List[Dict[str, Any]]:
    """
    Generate mock search results for testing/fallback
    """
    mock_recipes = [
        {
            "id": "recipe_001",
            "title": "卵・乳不使用 チョコレートケーキ",
            "source": "cookpad.com",
            "anshinScore": 87,
            "catchphrase": "アレルゲンフリー",
            "url": "https://cookpad.com/recipe/example1",
            "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop",
            "prepMinutes": 45,
            "calories": 280,
            "type": "Recipe",
            "type_reason": "mock_data"
        },
        {
            "id": "recipe_002", 
            "title": "グルテンフリー バナナマフィン",
            "source": "kurashiru.com",
            "anshinScore": 82,
            "catchphrase": "安心素材",
            "url": "https://kurashiru.com/recipe/example2",
            "image": "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=300&h=200&fit=crop",
            "prepMinutes": 30,
            "calories": 220,
            "type": "Recipe",
            "type_reason": "mock_data"
        },
        {
            "id": "recipe_003",
            "title": "卵なし パンケーキ",
            "source": "delish-kitchen.tv",
            "anshinScore": 79,
            "catchphrase": "ふわふわ食感",
            "url": "https://delish-kitchen.tv/recipe/example3", 
            "image": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop",
            "prepMinutes": 20,
            "calories": 180,
            "type": "Recipe",
            "type_reason": "mock_data"
        }
    ]
    return mock_recipes

async def fetch_page_content(url: str) -> Tuple[str, str]:
    """
    Fetch page content for recipe type detection
    Returns (content, error_reason)
    """
    try:
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; AnshinRecipe/1.0; +https://anshinrecipe.com/bot)'
        })
        
        if response.status_code != 200:
            return "", f"fetch_error_http_{response.status_code}"
            
        return response.text, ""
        
    except requests.exceptions.Timeout:
        return "", "fetch_error_timeout"
    except requests.exceptions.RequestException as e:
        return "", f"fetch_error_network"
    except Exception as e:
        return "", "fetch_error_unknown"

def detect_recipe_type_from_structured_data(html_content: str) -> Tuple[str, str]:
    """
    Detect recipe type from JSON-LD and Microdata
    Returns (type, reason)
    """
    try:
        # Look for JSON-LD structured data
        jsonld_pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
        jsonld_matches = re.findall(jsonld_pattern, html_content, re.DOTALL | re.IGNORECASE)
        
        for match in jsonld_matches:
            try:
                data = json.loads(match.strip())
                
                # Handle both single objects and arrays
                items = data if isinstance(data, list) else [data]
                
                for item in items:
                    if isinstance(item, dict):
                        # Check for Recipe type
                        item_type = item.get('@type', '').lower()
                        if 'recipe' in item_type:
                            # Verify required recipe fields
                            required_fields = ['name', 'recipeIngredient', 'recipeInstructions']
                            if all(field in item for field in required_fields):
                                return "Recipe", "jsonld_recipe_schema"
                        
                        # Check for non-recipe types that should be rejected
                        non_recipe_types = ['product', 'localbusiness', 'newsarticle', 'collectionpage', 'webpage', 'article']
                        if any(nrt in item_type for nrt in non_recipe_types):
                            return "NonRecipe", f"non_recipe_schema_{item_type}"
                            
            except json.JSONDecodeError:
                continue
        
        # Look for Microdata
        microdata_recipe = re.search(r'itemtype=["\'][^"\']*Recipe[^"\']*["\']', html_content, re.IGNORECASE)
        if microdata_recipe:
            # Check for required microdata properties
            has_ingredients = bool(re.search(r'itemprop=["\']recipeIngredient["\']', html_content, re.IGNORECASE))
            has_instructions = bool(re.search(r'itemprop=["\']recipeInstructions["\']', html_content, re.IGNORECASE))
            has_name = bool(re.search(r'itemprop=["\']name["\']', html_content, re.IGNORECASE))
            
            if has_ingredients and has_instructions and has_name:
                return "Recipe", "microdata_recipe_schema"
        
        # Check for non-recipe microdata
        non_recipe_microdata = ['Product', 'LocalBusiness', 'NewsArticle', 'CollectionPage']
        for nrt in non_recipe_microdata:
            if re.search(rf'itemtype=["\'][^"\']*{nrt}[^"\']*["\']', html_content, re.IGNORECASE):
                return "NonRecipe", f"non_recipe_schema_{nrt.lower()}"
        
        return "Unknown", "no_structured_data"
        
    except Exception as e:
        return "Unknown", "parse_failed"

def detect_recipe_type_from_html_heuristics(html_content: str, title: str = "") -> Tuple[str, str]:
    """
    Fallback HTML heuristics for recipe detection
    Returns (type, reason)
    """
    try:
        # Japanese recipe indicators
        recipe_indicators = [
            r'材料[:：\s]*[0-9]*人分',  # Ingredients for X servings
            r'作り方',                    # Instructions/How to make
            r'レシピ',                    # Recipe
            r'調理時間',                  # Cooking time
            r'カロリー',                  # Calories
            r'分量',                      # Portions
            r'手順',                      # Steps
            r'工程',                      # Process
        ]
        
        recipe_score = 0
        found_indicators = []
        
        # Check title first
        for indicator in recipe_indicators[:3]:  # Check main indicators in title
            if re.search(indicator, title, re.IGNORECASE):
                recipe_score += 2
                found_indicators.append(indicator)
        
        # Check HTML content
        for indicator in recipe_indicators:
            if re.search(indicator, html_content, re.IGNORECASE):
                recipe_score += 1
                found_indicators.append(indicator)
        
        # Check for specific recipe page patterns
        recipe_page_patterns = [
            r'<h[1-6][^>]*>.*?材料.*?</h[1-6]>',   # Materials heading
            r'<h[1-6][^>]*>.*?作り方.*?</h[1-6]>', # Instructions heading
            r'class=["\'][^"\']*recipe[^"\']*["\']', # Recipe CSS classes
            r'id=["\'][^"\']*recipe[^"\']*["\']',    # Recipe IDs
        ]
        
        for pattern in recipe_page_patterns:
            if re.search(pattern, html_content, re.IGNORECASE):
                recipe_score += 1
        
        # Non-recipe page indicators
        non_recipe_indicators = [
            r'商品.*?購入',               # Product purchase
            r'ニュース',                  # News
            r'記事一覧',                  # Article list
            r'カテゴリ.*?一覧',          # Category list
            r'検索結果',                  # Search results
            r'ログイン',                  # Login
            r'会員.*?登録',              # Member registration
        ]
        
        for indicator in non_recipe_indicators:
            if re.search(indicator, html_content, re.IGNORECASE):
                recipe_score -= 2
        
        # Determine type based on score
        if recipe_score >= 3:
            return "Recipe", f"html_heuristics_score_{recipe_score}"
        elif recipe_score <= -2:
            return "NonRecipe", f"non_recipe_layout_score_{recipe_score}"
        else:
            return "Ambiguous", f"ambiguous_layout_score_{recipe_score}"
            
    except Exception as e:
        return "Unknown", "heuristics_parse_failed"

async def detect_recipe_type(url: str, title: str = "") -> Tuple[str, str]:
    """
    Main recipe type detection function
    Returns (type, reason)
    """
    # First try to fetch the page content
    html_content, fetch_error = await fetch_page_content(url)
    
    if fetch_error:
        return "Unknown", fetch_error
    
    # Try structured data first (higher confidence)
    structured_type, structured_reason = detect_recipe_type_from_structured_data(html_content)
    
    if structured_type in ["Recipe", "NonRecipe"]:
        return structured_type, structured_reason
    
    # Fall back to HTML heuristics (lower confidence)
    heuristic_type, heuristic_reason = detect_recipe_type_from_html_heuristics(html_content, title)
    
    return heuristic_type, heuristic_reason

def parse_cse_results(cse_response: dict, query: str) -> List[Dict[str, Any]]:
    """
    Parse Google CSE response into recipe format
    """
    recipes = []
    items = cse_response.get('items', [])
    
    for i, item in enumerate(items[:10]):  # Limit to 10 results
        # Extract domain from URL
        url = item.get('link', '')
        domain = url.split('/')[2] if len(url.split('/')) > 2 else 'unknown'
        
        # Generate realistic AnshinScore based on domain and position
        domain_scores = {
            'cookpad.com': 85,
            'kurashiru.com': 82,
            'delish-kitchen.tv': 79,
            'recipe.rakuten.co.jp': 77,
            'orangepage.net': 80
        }
        base_score = domain_scores.get(domain, 75)
        position_penalty = i * 2  # Slight penalty for lower positions
        anshin_score = max(base_score - position_penalty, 60)
        
        # Extract snippet for catchphrase
        snippet = item.get('snippet', '')
        catchphrase = snippet[:20] + "..." if len(snippet) > 20 else snippet
        
        recipe = {
            "id": f"cse_{i+1}",
            "title": item.get('title', ''),
            "source": domain,
            "anshinScore": anshin_score,
            "catchphrase": catchphrase,
            "url": url,
            "image": item.get('pagemap', {}).get('cse_image', [{}])[0].get('src', 
                f"https://images.unsplash.com/photo-{1570000000000 + i}?w=300&h=200&fit=crop"),
            "prepMinutes": 25 + (i * 5),  # Estimated prep time
            "calories": 200 + (i * 30),    # Estimated calories
            "parseSource": "cse"
        }
        recipes.append(recipe)
    
    return recipes

async def call_google_cse(query: str) -> dict:
    """
    Call Google Custom Search Engine API
    """
    cse_key = os.environ.get('GOOGLE_CSE_KEY')
    cse_cx = os.environ.get('GOOGLE_CSE_CX')
    
    if not cse_key or not cse_cx:
        raise HTTPException(status_code=502, detail={
            "error": "cse_failed",
            "reason": "missing_credentials",
            "requestEcho": {"cx": cse_cx, "q": query, "params": {}}
        })
    
    params = {
        'key': cse_key,
        'cx': cse_cx,
        'q': query,
        'gl': 'jp',        # Geolocation: Japan
        'lr': 'lang_ja',   # Language: Japanese
        'safe': 'active',  # Safe search
        'num': 10          # Number of results
    }
    
    try:
        response = requests.get(
            'https://www.googleapis.com/customsearch/v1',
            params=params,
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail={
                "error": "cse_failed", 
                "reason": f"api_error_{response.status_code}",
                "requestEcho": {"cx": cse_cx, "q": query, "params": params}
            })
            
        return response.json()
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail={
            "error": "cse_failed",
            "reason": f"network_error: {str(e)}",
            "requestEcho": {"cx": cse_cx, "q": query, "params": params}
        })

@api_router.get("/v1/search")
async def search_recipes(
    q: str = Query(..., description="Search query"),
    context: Optional[str] = Query(None, description="Context filter"),
    allergens: Optional[str] = Query(None, description="Comma-separated allergen list"),
    debug: Optional[str] = Query(None, description="Enable debug mode")
):
    """
    Search for recipes using Google CSE or mock data based on MOCK_MODE
    """
    logger.info(f"Search request: q={q}, context={context}, allergens={allergens}, debug={debug}")
    
    mock_mode = os.environ.get('MOCK_MODE', '1')
    is_debug = debug == '1'
    
    # Determine datasource
    if mock_mode == '0':
        # Production mode - force CSE
        try:
            cse_response = await call_google_cse(q)
            recipes = parse_cse_results(cse_response, q)
            datasource = "cse"
            fallback_reason = None
            
        except HTTPException:
            # Re-raise CSE failures in production - no fallback to mock
            raise
            
    else:
        # Mock mode allowed
        recipes = get_mock_search_results(q, context)
        datasource = "mock"
        fallback_reason = "mock_mode_enabled"
    
    # Build response
    response_data = {
        "results": recipes,
        "count": len(recipes),
        "query": q
    }
    
    # Add debug information if requested
    if is_debug:
        response_data["debug"] = {
            "datasource": datasource,
            "parseSource": "cse" if datasource == "cse" else "mock",
            "fallbackReason": fallback_reason,
            "mockMode": mock_mode,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    return response_data

# Include the routers
app.include_router(api_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()