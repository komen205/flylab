"""DOOMFLY-compatible bilinear luminance sampling; pixels only, no game state."""
import numpy as np

def retinal_samples(rgb, uv):
    h,w=rgb.shape[:2]; x=uv[:,0]*(w-1); y=uv[:,1]*(h-1)
    x0=x.astype(int); y0=y.astype(int); x1=np.minimum(x0+1,w-1); y1=np.minimum(y0+1,h-1)
    dx=x-x0; dy=y-y0
    def luma(pixels):
        p=pixels.astype(np.float32)/255
        p=np.where(p<=.04045,p/12.92,((p+.055)/1.055)**2.4)
        return p@np.asarray([.2126,.7152,.0722],dtype=np.float32)
    return ((1-dx)*(1-dy)*luma(rgb[y0,x0])+dx*(1-dy)*luma(rgb[y0,x1])+(1-dx)*dy*luma(rgb[y1,x0])+dx*dy*luma(rgb[y1,x1])).astype(np.float32)
