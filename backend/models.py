from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, Boolean, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class PendantGeneration(Base):
    __tablename__ = 'pendant_generations'

    id = Column(String, primary_key=True)  # UUID
    created_at = Column(DateTime, server_default=func.now())
    
    # Input data
    input_image_url = Column(String, nullable=True)
    user_comment = Column(String, nullable=True)
    form_factor = Column(String, default='round', nullable=False)
    material = Column(String, default='gold', nullable=False)
    size = Column(String, default='pendant', nullable=False)
    
    # Output data
    output_images = Column(JSON, default=[], nullable=False)
    prompt_used = Column(Text, nullable=False)
    
    # Cost tracking
    cost_cents = Column(Integer, default=0)
    model_used = Column(String, nullable=True)
    
    # Session tracking
    session_id = Column(String, nullable=True)
    application_id = Column(String, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)

class Application(Base):
    __tablename__ = 'applications'

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    current_step = Column(Integer, default=1, nullable=False)
    status = Column(String, default='draft', nullable=False)
    form_factor = Column(String, default='round')
    material = Column(String, default='gold')
    size = Column(String, default='pendant')
    input_image_url = Column(String, nullable=True)
    user_comment = Column(String, nullable=True)
    generated_preview = Column(String, nullable=True)
    has_back_engraving = Column(Integer, default=0) # SQLite uses Integer for Boolean usually
    back_image_url = Column(String, nullable=True)
    back_comment = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class GenerationSettings(Base):
    __tablename__ = 'generation_settings'
    
    key = Column(String, primary_key=True)
    value = Column(JSON)

class Example(Base):
    __tablename__ = 'examples'

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    before_image_url = Column(String, nullable=True)
    after_image_url = Column(String, nullable=True)
    model_3d_url = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
