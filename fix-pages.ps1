# Fix ProfilePage
(Get-Content 'app\profile\page.js' -Raw) -replace "import React from 'react';", "'use client'

import React from 'react';" -replace "from 'react-router-dom'", "from 'next/navigation'" -replace "import { Link, useNavigate }", "import Link from 'next/link';
import { useRouter }" -replace "const navigate = useNavigate\(\);", "const router = useRouter();" -replace "navigate\('/', { replace: true }\);", "router.push('/');" -replace "navigate\('/'\);", "router.push('/');" -replace "from '../hooks/", "from '@/hooks/" -replace "from '../components/", "from '@/components/" | Set-Content 'app\profile\page.js'

# Fix AddRecipePage  
(Get-Content 'app\recipe\new\page.js' -Raw) -replace "import React", "'use client'

import React" -replace "from 'react-router-dom'", "from 'next/navigation'" -replace "import { Link, useNavigate }", "import Link from 'next/link';
import { useRouter }" -replace "const navigate = useNavigate\(\);", "const router = useRouter();" -replace "navigate\('/'\);", "router.push('/');" -replace "from '../../hooks/", "from '@/hooks/" -replace "from '../../components/", "from '@/components/" -replace "from '../../data/", "from '@/data/" | Set-Content 'app\recipe\new\page.js'

# Fix RecipeDetailPage
(Get-Content 'app\recipe\[id]\page.js' -Raw) -replace "import React", "'use client'

import React" -replace "from 'react-router-dom'", "from 'next/navigation'" -replace "import { Link, useNavigate, useParams }", "import Link from 'next/link';
import { useRouter, useParams }" -replace "const navigate = useNavigate\(\);", "const router = useRouter();" -replace "navigate\('/'\);", "router.push('/');" -replace "from '../../hooks/", "from '@/hooks/" -replace "from '../../components/", "from '@/components/" | Set-Content 'app\recipe\[id]\page.js'

Write-Host "Pages updated successfully"
